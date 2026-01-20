import { reactive, watch, computed } from 'vue';
import { loadGlobalData, saveGlobalData } from './utils/storage';
import { KUNGFU_DEFINITIONS, DEFAULT_INVENTORY } from './data/kungfu';
import { ITEM_DEFINITIONS } from './data/items';
import { getGameBridge, ESTATE_CONSTANTS } from './ecs/GameBridge';

// Wuxia Terminology
const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '独孤', '令狐', '西门', '东方', '慕容', '上官', '南宫'];
const NAMES = ['逍遥', '无忌', '寻欢', '吹雪', '不败', '留香', '灵珊', '盈盈', '语嫣', '靖', '康', '过', '龙', '峰', '誉', '竹', '梅', '兰', '菊', '风', '云', '霜', '雪', '剑', '刀', '行', '天', '问'];

const METHODS = ['站桩', '冥想', '挥剑', '打坐', '举石', '听瀑', '观云', '读经'];
const BODY_PARTS = ['胸口', '左肩', '右臂', '下盘', '背心', '面门'];
const MOVES = ['黑虎掏心', '白鹤亮翅', '太极推手', '亢龙有悔', '落英神剑', '一阳指', '独孤九剑', '天外飞仙'];

// Constants
const BASE_DAMAGE = 9;
const MAX_HEALTH_POOL = 200;
const MAX_QI = 280;
const MAX_TIQI = 30000;
const TIQI_REGEN = 1200; // Per Second

// Neili Types Definition (表1: 内力类型对人物属性的影响)
// [Type Name]: [力道/卸力, 精妙/拆招, 迅疾/闪避, 动心/守心, 破体/御体, 破气/御气]
export const NEILI_TYPES = {
  '金刚': [5, 2, 2, 3, 8, 2],
  '紫霞': [2, 3, 5, 2, 3, 7],
  '玄阴': [2, 2, 3, 5, 2, 8],
  '纯阳': [3, 3, 3, 3, 5, 5],
  '归元': [3, 5, 2, 2, 7, 3],
  '混元': [3, 3, 3, 3, 5, 5],
};

// Qi Allocation Types Definition (表2: 真气分配对人物属性的影响)
// 攻击属性: [力道, 精妙, 迅疾, 动心, 破体, 破气]
// 防御属性: [卸力, 拆招, 闪避, 守心, 御体, 御气]
export const QI_ALLOCATION_TYPES = {
  '摧破': { attack: [1, 6, 3, 3, 1, 1], defense: [0, 0, 0, 0, 0, 0] },
  '轻灵': { attack: [6, 3, 1, 3, 3, 6], defense: [3, 6, 1, 3, 3, 6] },
  '护体': { attack: [0, 0, 0, 0, 0, 0], defense: [1, 3, 6, 3, 1, 1] },
  '奇窍': { attack: [3, 1, 6, 3, 6, 3], defense: [6, 1, 3, 3, 6, 3] },
};

// Initial Player State Template
const defaultPlayerState = {
  name: '',
  // 6组基础属性: 力道/卸力, 精妙/拆招, 迅疾/闪避, 动心/守心, 破体/御体, 破气/御气
  basePower: 50,      // 力道
  baseParry: 50,      // 卸力
  baseFinesse: 50,    // 精妙 - 影响暴击
  baseDismantle: 50,  // 拆招 - 抵抗暴击
  baseSwiftness: 50,  // 迅疾 - 影响闪避
  baseDodge: 50,      // 闪避 - 闪避几率
  baseInsight: 50,    // 动心 - 影响破绽发现
  baseMindGuard: 50,  // 守心 - 抵抗破绽
  basePenetration: 50, // 破体
  baseResistance: 50,  // 御体
  baseQiBreach: 50,    // 破气
  baseQiGuard: 50,     // 御气
  qi: 80,
  // 4种真气分配类型
  qiDestruction: 0,  // 摧破
  qiAgile: 0,        // 轻灵
  qiProtection: 0,   // 护体
  qiMeridian: 0,     // 奇窍
  neiliType: '混元',
  internalRatio: 0,

  // Estate & Currency
  money: 0,
  prestige: 0,
  estate: {
    marketLevel: 1,
    hallLevel: 1
  },

  // KungFu System
  inventory: [...DEFAULT_INVENTORY],
  equipment: {
    internal: [], // Now an array of IDs
    destruction: [],
    protection: [],
  },
  activeInternalId: null, // The internal used for Meditation/Neili Type

  // Physical Equipment
  gear: {
    weapon: null,
    armor: null,
  },
  bag: [],
  itemCounts: {}, // Stores "plus" level: { id: count }. 0 means +0 (default).

  resources: { shi: 0, tiqi: 0 },
};

// Global App State
export const globalState = reactive({
  slots: [null, null, null],
  activeSlotIndex: -1,
});

// Active Game State (for UI binding)
export const state = reactive({
  player: { ...defaultPlayerState },
  logs: [],
  battleReports: [],
  combatState: {
    inCombat: false,
    phase: 'idle', // idle, prep, active, result
    skipping: false,
    enemy: null,
    playerMarks: 0,
    enemyMarks: 0,
    playerDamagePool: 0,
    enemyDamagePool: 0,
    round: 0,
    currentBattleLogs: [],
  }
});

// Computed Effective Stats
// 公式: 最终属性 = 基础属性 + 内力倍率 * Σ(真气分配 * 真气类型加成)
export const effectiveStats = computed(() => {
  const p = state.player;
  const m = NEILI_TYPES[p.neiliType] || NEILI_TYPES['混元'];
  // m = [力道/卸力, 精妙/拆招, 迅疾/闪避, 动心/守心, 破体/御体, 破气/御气]

  const qD = p.qiDestruction || 0; // 摧破
  const qA = p.qiAgile || 0;       // 轻灵
  const qP = p.qiProtection || 0;  // 护体
  const qM = p.qiMeridian || 0;    // 奇窍

  const D = QI_ALLOCATION_TYPES['摧破'];
  const A = QI_ALLOCATION_TYPES['轻灵'];
  const P = QI_ALLOCATION_TYPES['护体'];
  const M = QI_ALLOCATION_TYPES['奇窍'];

  // 攻击属性 (6个): 力道, 精妙, 迅疾, 动心, 破体, 破气
  const attackBonus = (idx) => m[idx] * (qD * D.attack[idx] + qA * A.attack[idx] + qM * M.attack[idx]);

  // 防御属性 (6个): 卸力, 拆招, 闪避, 守心, 御体, 御气
  const defenseBonus = (idx) => m[idx] * (qA * A.defense[idx] + qP * P.defense[idx] + qM * M.defense[idx]);

  const stats = {
    // 力道/卸力
    power: p.basePower + attackBonus(0),
    parry: p.baseParry + defenseBonus(0),
    // 精妙/拆招
    finesse: (p.baseFinesse || 50) + attackBonus(1),
    dismantle: (p.baseDismantle || 50) + defenseBonus(1),
    // 迅疾/闪避
    swiftness: (p.baseSwiftness || 50) + attackBonus(2),
    dodge: (p.baseDodge || 50) + defenseBonus(2),
    // 动心/守心
    insight: (p.baseInsight || 50) + attackBonus(3),
    mindGuard: (p.baseMindGuard || 50) + defenseBonus(3),
    // 破体/御体
    penetration: p.basePenetration + attackBonus(4),
    resistance: p.baseResistance + defenseBonus(4),
    // 破气/御气
    qiBreach: p.baseQiBreach + attackBonus(5),
    qiGuard: p.baseQiGuard + defenseBonus(5),
  };

  // Add Gear Stats
  if (p.gear) {
    if (p.gear.weapon && ITEM_DEFINITIONS[p.gear.weapon]) {
      const w = ITEM_DEFINITIONS[p.gear.weapon].stats;
      if (w.power) stats.power += w.power;
      if (w.penetration) stats.penetration += w.penetration;
      if (w.qiBreach) stats.qiBreach += w.qiBreach;
      if (w.finesse) stats.finesse += w.finesse;
      if (w.swiftness) stats.swiftness += w.swiftness;
      if (w.insight) stats.insight += w.insight;
    }
    if (p.gear.armor && ITEM_DEFINITIONS[p.gear.armor]) {
      const a = ITEM_DEFINITIONS[p.gear.armor].stats;
      if (a.parry) stats.parry += a.parry;
      if (a.resistance) stats.resistance += a.resistance;
      if (a.qiGuard) stats.qiGuard += a.qiGuard;
      if (a.dismantle) stats.dismantle += a.dismantle;
      if (a.dodge) stats.dodge += a.dodge;
      if (a.mindGuard) stats.mindGuard += a.mindGuard;
    }
  }

  return stats;
});

// Computed Slots Capacity
export const slotCapacity = computed(() => {
  const internals = state.player.equipment.internal;
  let totalDest = 0;
  let totalProt = 0;

  // Base slots (optional, usually 0)

  if (Array.isArray(internals)) {
    internals.forEach(id => {
      if (KUNGFU_DEFINITIONS[id]) {
        totalDest += KUNGFU_DEFINITIONS[id].slots.destruction;
        totalProt += KUNGFU_DEFINITIONS[id].slots.protection;
      }
    });
  }

  return { destruction: totalDest, protection: totalProt };
});

// --- HELPERS ---

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  return randomElem(SURNAMES) + randomElem(NAMES);
}

// --- GLOBAL MANAGEMENT ---

export function initGlobal() {
  const data = loadGlobalData();
  globalState.slots = data.slots;
}

export function createSaveInSlot(slotIndex) {
  const newPlayer = JSON.parse(JSON.stringify(defaultPlayerState));
  newPlayer.name = generateName();
  // 初始化6组基础属性
  newPlayer.basePower = randomInt(50, 60);
  newPlayer.baseParry = randomInt(50, 60);
  newPlayer.baseFinesse = randomInt(50, 60);
  newPlayer.baseDismantle = randomInt(50, 60);
  newPlayer.baseSwiftness = randomInt(50, 60);
  newPlayer.baseDodge = randomInt(50, 60);
  newPlayer.baseInsight = randomInt(50, 60);
  newPlayer.baseMindGuard = randomInt(50, 60);
  newPlayer.basePenetration = randomInt(50, 60);
  newPlayer.baseResistance = randomInt(50, 60);
  newPlayer.baseQiBreach = randomInt(50, 60);
  newPlayer.baseQiGuard = randomInt(50, 60);

  const saveObj = {
    player: newPlayer,
    logs: [
      { id: Date.now(), text: `初入江湖，你的名字是 ${newPlayer.name}。`, type: 'system', timestamp: new Date().toLocaleTimeString() },
      { id: Date.now()+1, text: `你获得了一些基础功法。`, type: 'system', timestamp: new Date().toLocaleTimeString() }
    ],
    battleReports: [],
    lastPlayed: Date.now()
  };

  globalState.slots[slotIndex] = saveObj;
  saveGlobalData({ meta: { version: 2 }, slots: globalState.slots });

  loadSlot(slotIndex);
}

export function loadSlot(slotIndex) {
  const slotData = globalState.slots[slotIndex];
  if (!slotData) return;

  globalState.activeSlotIndex = slotIndex;

  // Load into active state
  state.player = JSON.parse(JSON.stringify(slotData.player));

  // Migration: Ensure new fields exist
  if (!state.player.neiliType) state.player.neiliType = '混元';
  if (state.player.internalRatio === undefined) state.player.internalRatio = 0;
  if (!state.player.inventory) state.player.inventory = [...DEFAULT_INVENTORY];
  if (!state.player.equipment) state.player.equipment = { internal: [], destruction: [], protection: [] };

  // Migrate internal from string to array
  if (typeof state.player.equipment.internal === 'string') {
     const oldInternal = state.player.equipment.internal;
     state.player.equipment.internal = [oldInternal];
     if (!state.player.activeInternalId) state.player.activeInternalId = oldInternal;
  } else if (!Array.isArray(state.player.equipment.internal)) {
     state.player.equipment.internal = [];
  }

  // Ensure activeInternalId is set if internals exist
  if (!state.player.activeInternalId && state.player.equipment.internal.length > 0) {
      state.player.activeInternalId = state.player.equipment.internal[0];
  }

  if (!state.player.resources) state.player.resources = { shi: 0, tiqi: 0 };

  // Estate Migration
  if (state.player.money === undefined) state.player.money = 0;
  if (state.player.prestige === undefined) state.player.prestige = 0;
  if (!state.player.estate) state.player.estate = { marketLevel: 1, hallLevel: 1 };
  if (!state.player.gear) state.player.gear = { weapon: null, armor: null };
  if (!state.player.bag) state.player.bag = [];
  if (!state.player.itemCounts) state.player.itemCounts = {};

  // Migration: New 6-pair stats (精妙/拆招, 迅疾/闪避, 动心/守心)
  if (state.player.baseFinesse === undefined) state.player.baseFinesse = randomInt(50, 60);
  if (state.player.baseDismantle === undefined) state.player.baseDismantle = randomInt(50, 60);
  if (state.player.baseSwiftness === undefined) state.player.baseSwiftness = randomInt(50, 60);
  if (state.player.baseDodge === undefined) state.player.baseDodge = randomInt(50, 60);
  if (state.player.baseInsight === undefined) state.player.baseInsight = randomInt(50, 60);
  if (state.player.baseMindGuard === undefined) state.player.baseMindGuard = randomInt(50, 60);

  // Migration: New qi allocation types (轻灵, 奇窍)
  if (state.player.qiAgile === undefined) state.player.qiAgile = 0;
  if (state.player.qiMeridian === undefined) state.player.qiMeridian = 0;

  state.logs = JSON.parse(JSON.stringify(slotData.logs));
  state.battleReports = JSON.parse(JSON.stringify(slotData.battleReports || []));

  // Gift: 10x Draw Resource Pack
  if (!state.player.receivedWelcomeGift) {
    state.player.money += 1000;
    state.player.prestige += 1000;
    state.player.receivedWelcomeGift = true;
    addLog('收到系统赠礼：10连抽资源包', 'system');
  }

  // Reset combat state
  state.combatState = {
    inCombat: false,
    phase: 'idle',
    skipping: false,
    enemy: null,
    playerMarks: 0,
    enemyMarks: 0,
    playerDamagePool: 0,
    enemyDamagePool: 0,
    round: 0,
    currentBattleLogs: [],
  };

  addLog('欢迎回来，侠士 ' + state.player.name);
}

export function deleteSlot(slotIndex) {
  globalState.slots[slotIndex] = null;
  saveGlobalData({ meta: { version: 2 }, slots: globalState.slots });
}

export function exitToMenu() {
  globalState.activeSlotIndex = -1;
}

// Auto-save Watcher
watch(
  () => ({ player: state.player, logs: state.logs, battleReports: state.battleReports }),
  (newVal) => {
    if (globalState.activeSlotIndex === -1) return;

    // Update the slot in global state
    const slotIndex = globalState.activeSlotIndex;
    if (globalState.slots[slotIndex]) {
        globalState.slots[slotIndex].player = newVal.player;
        globalState.slots[slotIndex].logs = newVal.logs;
        globalState.slots[slotIndex].battleReports = newVal.battleReports;
        globalState.slots[slotIndex].lastPlayed = Date.now();

        saveGlobalData({ meta: { version: 2 }, slots: globalState.slots });
    }
  },
  { deep: true }
);

// --- KUNGFU ACTIONS ---

export function drawKungFu() {
  if (state.combatState.inCombat) return;

  const cost = ESTATE_CONSTANTS.DRAW_KUNGFU_COST;
  if (state.player.prestige < cost) {
    addLog(`威望不足 (需 ${cost})。`, 'system');
    return;
  }
  state.player.prestige -= cost;

  const allIds = Object.keys(KUNGFU_DEFINITIONS);
  const randomId = randomElem(allIds);

  const name = KUNGFU_DEFINITIONS[randomId].name;
  let logStr = '';

  if (state.player.inventory.includes(randomId)) {
    // Duplicate
    state.player.itemCounts[randomId] = (state.player.itemCounts[randomId] || 0) + 1;
    logStr = `消耗威望，寻访名师，获得重复功法【${name} +${state.player.itemCounts[randomId]}】！`;
  } else {
    // New
    state.player.inventory.push(randomId);
    state.player.itemCounts[randomId] = 0;
    logStr = `消耗威望，寻访名师，习得【${name}】！`;
  }

  addLog(logStr, 'growth');
}

export function equipKungFu(kfId) {
  const def = KUNGFU_DEFINITIONS[kfId];
  if (!def) return;

  if (def.type === 'internal') {
    // Check if already equipped
    if (state.player.equipment.internal.includes(kfId)) {
        addLog(`该内功已装备。`, 'system');
        return;
    }
    // Check capacity (Max 3)
    if (state.player.equipment.internal.length >= 3) {
        addLog(`内功栏位已满 (上限3个)。`, 'system');
        return;
    }

    state.player.equipment.internal.push(kfId);

    // Auto-activate if it's the first one
    if (state.player.equipment.internal.length === 1) {
        activateInternal(kfId);
    }

    addLog(`装备了内功【${def.name}】。`);

    // Check caps (should increase, so no need to truncate usually, but good practice to verify?
    // Since we add slots, we don't need to truncate.)
  } else if (def.type === 'destruction') {
    if (state.player.equipment.destruction.includes(kfId)) {
        addLog(`该功法已装备。`, 'system');
        return;
    }

    const cap = slotCapacity.value.destruction;
    if (state.player.equipment.destruction.length < cap) {
        state.player.equipment.destruction.push(kfId);
        addLog(`装备了催破【${def.name}】。`);
    } else {
        addLog(`催破槽位已满！`);
    }
  } else if (def.type === 'protection') {
    if (state.player.equipment.protection.includes(kfId)) {
        addLog(`该功法已装备。`, 'system');
        return;
    }

    const cap = slotCapacity.value.protection;
    if (state.player.equipment.protection.length < cap) {
        state.player.equipment.protection.push(kfId);
        addLog(`装备了护体【${def.name}】。`);
    } else {
        addLog(`护体槽位已满！`);
    }
  }
}

export function unequipKungFu(type, index) {
    if (type === 'internal') {
        const removedId = state.player.equipment.internal[index];
        state.player.equipment.internal.splice(index, 1);

        // If removed was active, reset active
        if (state.player.activeInternalId === removedId) {
            state.player.activeInternalId = null;
            // Pick new active if available
            if (state.player.equipment.internal.length > 0) {
                activateInternal(state.player.equipment.internal[0]);
            } else {
                state.player.neiliType = '混元';
            }
        }

        // Truncate other slots if capacity dropped below current usage
        const cap = slotCapacity.value;
        if (state.player.equipment.destruction.length > cap.destruction) {
            state.player.equipment.destruction.length = cap.destruction;
            addLog(`摧破栏位减少，部分功法自动卸下。`, 'system');
        }
        if (state.player.equipment.protection.length > cap.protection) {
            state.player.equipment.protection.length = cap.protection;
            addLog(`护体栏位减少，部分功法自动卸下。`, 'system');
        }

        addLog(`卸下了内功。`);
    } else {
        state.player.equipment[type].splice(index, 1);
        addLog(`卸下了功法。`);
    }
}

export function activateInternal(kfId) {
    if (!state.player.equipment.internal.includes(kfId)) return;
    state.player.activeInternalId = kfId;

    // Update Neili Type immediately?
    // User: "True Qi calculation follows Neili Type unchanged"
    // Meditate updates it? Or "Equip internal + Meditate => Change Neili".
    // Let's stick to: Meditate updates it, BUT setting active internal might imply intent.
    // However, original logic was "Meditation updates Neili Type based on equipped".
    // So now "Meditation updates Neili Type based on Active Internal".
    // Does setting Active Internal change Neili Type immediately?
    // "2 周天内功另外设定，真气计算跟随内力类型不变"
    // This implies setting the "Meditation Internal" is the action.
    // The Neili Type likely changes when you *Meditate* on it, OR immediately?
    // Let's make it consistent with previous logic: `meditate` does the update.
    // But UI might want to show the change?
    // Let's just update `neiliType` immediately for better UX, or let meditate do it.
    // Previous `meditate` code: `if (state.player.neiliType !== newType) { ... addLog ... }`
    // So it happened during meditation. I will keep that.

    // Actually, let's update immediately so the UI badge updates.
    const def = KUNGFU_DEFINITIONS[kfId];
    if (def) {
        state.player.neiliType = def.neiliType;
        addLog(`将周天运转内功切换为【${def.name}】。`, 'system');
    }
}

// --- GAME ACTIONS ---

function addLog(text, type = 'system', data = null) {
  const logEntry = {
    id: Date.now() + Math.random(),
    text,
    type,
    timestamp: new Date().toLocaleTimeString(),
    ...data
  };
  state.logs.unshift(logEntry);
}

function addCombatLog(text) {
  const logEntry = {
    text,
    timestamp: new Date().toLocaleTimeString(),
  };
  state.combatState.currentBattleLogs.push(logEntry);
}

export function meditate() {
  if (state.combatState.inCombat) return;

  // Update Neili Type based on Active Internal KungFu
  const activeId = state.player.activeInternalId;
  if (activeId && KUNGFU_DEFINITIONS[activeId]) {
    const newType = KUNGFU_DEFINITIONS[activeId].neiliType;
    if (state.player.neiliType !== newType) {
        state.player.neiliType = newType;
        addLog(`运转【${KUNGFU_DEFINITIONS[activeId].name}】，内力属性转为【${newType}】！`, 'growth');
    }
  }

  // Estate Production (Month Flow)
  const marketIncome = state.player.estate.marketLevel * ESTATE_CONSTANTS.MARKET_OUTPUT_PER_LEVEL;
  const hallIncome = state.player.estate.hallLevel * ESTATE_CONSTANTS.HALL_OUTPUT_PER_LEVEL;
  state.player.money += marketIncome;
  state.player.prestige += hallIncome;

  let logMsg = `岁月流转，获得 金钱+${marketIncome}，威望+${hallIncome}。`;

  // Qi Gain
  if (state.player.qi < MAX_QI) {
    const gain = 1;
    state.player.qi = Math.min(state.player.qi + gain, MAX_QI);
    logMsg += ` 丹田温热，真气上限提升至 ${state.player.qi}。`;
  } else {
    logMsg += ` 真气已达瓶颈 (${MAX_QI})。`;
  }

  addLog(logMsg, 'growth');
}

// --- ESTATE & ITEM ACTIONS ---

export function upgradeBuilding(type) {
  if (type === 'market') {
    const cost = state.player.estate.marketLevel * ESTATE_CONSTANTS.MARKET_UPGRADE_COST_MULT;
    if (state.player.money >= cost) {
      state.player.money -= cost;
      state.player.estate.marketLevel++;
      addLog(`扩建市集，等级提升至 ${state.player.estate.marketLevel}！`, 'growth');
    } else {
      addLog(`金钱不足 (需 ${cost})。`, 'system');
    }
  } else if (type === 'hall') {
    const cost = state.player.estate.hallLevel * ESTATE_CONSTANTS.HALL_UPGRADE_COST_MULT;
    if (state.player.prestige >= cost) {
      state.player.prestige -= cost;
      state.player.estate.hallLevel++;
      addLog(`修缮祠堂，等级提升至 ${state.player.estate.hallLevel}！`, 'growth');
    } else {
      addLog(`威望不足 (需 ${cost})。`, 'system');
    }
  }
}

export function drawEquipment() {
  const cost = ESTATE_CONSTANTS.DRAW_EQUIPMENT_COST;
  if (state.player.money < cost) {
    addLog(`金钱不足 (需 ${cost})。`, 'system');
    return;
  }
  state.player.money -= cost;

  const allItems = Object.keys(ITEM_DEFINITIONS);
  const randomId = randomElem(allItems);

  const name = ITEM_DEFINITIONS[randomId].name;
  const isOwned = state.player.bag.includes(randomId) ||
                  state.player.gear.weapon === randomId ||
                  state.player.gear.armor === randomId;

  let logStr = '';
  if (isOwned) {
    state.player.itemCounts[randomId] = (state.player.itemCounts[randomId] || 0) + 1;
    logStr = `在市集淘得一件重复装备【${name} +${state.player.itemCounts[randomId]}】！`;
  } else {
    state.player.bag.push(randomId);
    state.player.itemCounts[randomId] = 0;
    logStr = `在市集淘得一件【${name}】！`;
  }

  addLog(logStr, 'growth');
}

export function equipItem(itemId) {
  const def = ITEM_DEFINITIONS[itemId];
  if (!def) return;

  if (def.type === 'weapon') {
    // Unequip current if any
    if (state.player.gear.weapon) {
       state.player.bag.push(state.player.gear.weapon);
    }
    state.player.gear.weapon = itemId;
    // Remove from bag
    const idx = state.player.bag.indexOf(itemId);
    if (idx > -1) state.player.bag.splice(idx, 1);

    addLog(`装备了武器【${def.name}】。`);
  } else if (def.type === 'armor') {
    if (state.player.gear.armor) {
       state.player.bag.push(state.player.gear.armor);
    }
    state.player.gear.armor = itemId;
    const idx = state.player.bag.indexOf(itemId);
    if (idx > -1) state.player.bag.splice(idx, 1);

    addLog(`穿上了护甲【${def.name}】。`);
  }
}

export function unequipItem(slot) {
  const current = state.player.gear[slot];
  if (current) {
    state.player.bag.push(current);
    state.player.gear[slot] = null;
    addLog(`卸下了${slot === 'weapon' ? '武器' : '护甲'}。`);
  }
}

// 获取已使用的总真气
export function getUsedQi() {
  const p = state.player;
  return (p.qiDestruction || 0) + (p.qiAgile || 0) + (p.qiProtection || 0) + (p.qiMeridian || 0);
}

// 分配真气 (4种类型: destruction/agile/protection/meridian)
export function allocateQi(type, amount) {
  if (amount > 0) {
    const used = getUsedQi();
    if (used < state.player.qi) {
      if (type === 'destruction') state.player.qiDestruction++;
      else if (type === 'agile') state.player.qiAgile = (state.player.qiAgile || 0) + 1;
      else if (type === 'protection') state.player.qiProtection++;
      else if (type === 'meridian') state.player.qiMeridian = (state.player.qiMeridian || 0) + 1;
    }
  } else {
    if (type === 'destruction' && state.player.qiDestruction > 0) state.player.qiDestruction--;
    else if (type === 'agile' && (state.player.qiAgile || 0) > 0) state.player.qiAgile--;
    else if (type === 'protection' && state.player.qiProtection > 0) state.player.qiProtection--;
    else if (type === 'meridian' && (state.player.qiMeridian || 0) > 0) state.player.qiMeridian--;
  }
}

export function allocateAllQi(type) {
  const used = getUsedQi();
  const remaining = state.player.qi - used;
  if (remaining <= 0) return;

  if (type === 'destruction') {
    state.player.qiDestruction += remaining;
  } else if (type === 'agile') {
    state.player.qiAgile = (state.player.qiAgile || 0) + remaining;
  } else if (type === 'protection') {
    state.player.qiProtection += remaining;
  } else if (type === 'meridian') {
    state.player.qiMeridian = (state.player.qiMeridian || 0) + remaining;
  }
}

export function allocateEvenly() {
  const used = getUsedQi();
  const remaining = state.player.qi - used;
  if (remaining <= 0) return;

  const quarter = Math.floor(remaining / 4);
  const remainder = remaining % 4;

  // 平均分配给4种类型，余数按摧破>轻灵>护体>奇窍分配
  state.player.qiDestruction += quarter + (remainder >= 1 ? 1 : 0);
  state.player.qiAgile = (state.player.qiAgile || 0) + quarter + (remainder >= 2 ? 1 : 0);
  state.player.qiProtection += quarter + (remainder >= 3 ? 1 : 0);
  state.player.qiMeridian = (state.player.qiMeridian || 0) + quarter;
}

export function resetQiAllocation() {
  state.player.qiDestruction = 0;
  state.player.qiAgile = 0;
  state.player.qiProtection = 0;
  state.player.qiMeridian = 0;
}

// Helper to reset state for testing
export function resetState() {
  // Reset Global
  globalState.slots = [null, null, null];
  globalState.activeSlotIndex = -1;

  // Reset Active Player
  Object.assign(state.player, JSON.parse(JSON.stringify(defaultPlayerState)));
  state.logs = [];
  state.battleReports = [];
  state.combatState = {
    inCombat: false,
    phase: 'idle',
    skipping: false,
    enemy: null,
    playerMarks: 0,
    enemyMarks: 0,
    playerDamagePool: 0,
    enemyDamagePool: 0,
    round: 0,
    currentBattleLogs: [],
  };
}

// Function to calculate Damage Decay based on ratio
export function calculateDecay(ratio) {
  // y = 12.51 / (12.51 + x)
  return 12.51 / (12.51 + ratio);
}

export async function prepareCombat() {
  if (state.combatState.inCombat) return;

  // 使用ECS系统生成NPC对手
  const bridge = getGameBridge();
  const playerTotalQi = state.player.qi;

  // 生成ECS NPC
  const npcEntity = bridge.generateOpponent(playerTotalQi);
  const npcInfo = bridge.getNPCInfo(npcEntity);

  // 将NPC转换为旧版敌人格式（兼容现有战斗系统）
  const enemyStats = bridge.npcToLegacyEnemy(npcEntity);

  // 添加NPC的额外信息到敌人数据
  const identity = npcEntity.getComponent('Identity');
  if (identity?.title) {
    enemyStats.title = identity.title;
  }
  if (identity?.faction) {
    enemyStats.faction = identity.faction;
  }

  // Init State
  state.combatState.inCombat = false; // Waiting for start
  state.combatState.phase = 'prep';
  state.combatState.skipping = false;
  state.combatState.enemy = enemyStats;
  state.combatState.npcEntity = npcEntity; // 保存NPC实体引用
  state.combatState.playerMarks = 0;
  state.combatState.enemyMarks = 0;
  state.combatState.playerDamagePool = 0;
  state.combatState.enemyDamagePool = 0;
  state.combatState.round = 0;
  state.combatState.currentBattleLogs = [];

  // Init Combat Resources
  state.player.resources.shi = 0;
  state.player.resources.tiqi = 0;

  // No loop start here
}

export function startFighting() {
  if (state.combatState.phase !== 'prep') return;
  state.combatState.phase = 'active';
  state.combatState.inCombat = true;

  const enemyStats = state.combatState.enemy;
  const enemyName = enemyStats.name;
  const enemyType = enemyStats.neiliType;

  // 构建敌人描述（包含称号和门派）
  let enemyDesc = enemyName;
  if (enemyStats.title) {
    enemyDesc = `${enemyStats.title} ${enemyName}`;
  }
  if (enemyStats.faction) {
    enemyDesc += ` (${enemyStats.faction})`;
  }

  addLog(`遭遇了 ${enemyDesc}！战斗开始！`, 'combat');
  addCombatLog(`遭遇了 ${enemyDesc}！`);
  addCombatLog(`敌方属性 [${enemyType}] - 力:${Math.round(enemyStats.power)} 卸:${Math.round(enemyStats.parry)}`);
  addCombatLog(`内伤占比: ${enemyStats.internalRatio}%`);

  combatLoop();
}

export function exitCombat() {
  state.combatState.phase = 'idle';
  state.combatState.inCombat = false;
  state.combatState.enemy = null;
  state.combatState.currentBattleLogs = [];
}

export function skipCombat() {
  if (!state.combatState.inCombat) return;
  state.combatState.skipping = true;
}

async function combatLoop() {
  while (state.combatState.inCombat) {
    state.combatState.round++;

    // Regen TiQi (1200/sec). Round is roughly 1 sec (due to wait).
    // If skipping, assume same time passed for logic?
    // Or instant? If instant, infinite tiqi? No, let's just add per round.
    state.player.resources.tiqi = Math.min(state.player.resources.tiqi + TIQI_REGEN, MAX_TIQI);

    if (!state.combatState.skipping) await new Promise(r => setTimeout(r, 1000));

    const pStats = {
      ...effectiveStats.value,
      name: state.player.name,
      internalRatio: state.player.internalRatio
    };
    const eStats = state.combatState.enemy;

    // Player attacks Enemy
    resolvePlayerAttack(pStats, eStats);
    if (checkEndCombat()) break;

    if (!state.combatState.skipping) await new Promise(r => setTimeout(r, 1000));

    // Enemy attacks Player
    resolveEnemyAttack(eStats, pStats);
    if (checkEndCombat()) break;
  }
}

export function resolvePlayerAttack(attacker, defender) {
  // Check for Destruction Skill
  const destructionSkills = state.player.equipment.destruction;
  let skill = null;

  // Find usable skills
  const usableSkills = destructionSkills
    .map(id => KUNGFU_DEFINITIONS[id])
    .filter(def => def && state.player.resources.shi >= def.costShi);

  if (usableSkills.length > 0) {
    // Randomly pick one
    skill = randomElem(usableSkills);
    state.player.resources.shi -= skill.costShi;
  }

  // Apply Skill Bonuses
  let effectiveAttacker = { ...attacker };
  let skillName = '普通攻击';

  if (skill) {
    skillName = skill.name;
    if (skill.bonuses) {
      if (skill.bonuses.power) effectiveAttacker.power *= (1 + skill.bonuses.power);
      if (skill.bonuses.penetration) effectiveAttacker.penetration *= (1 + skill.bonuses.penetration);
      if (skill.bonuses.qiBreach) effectiveAttacker.qiBreach *= (1 + skill.bonuses.qiBreach);
    }
  }

  // Standard Resolution (力道 vs 卸力)
  let hitRate = 0;
  if (effectiveAttacker.power > defender.parry) {
    hitRate = effectiveAttacker.power / defender.parry;
  } else {
    hitRate = (effectiveAttacker.power / defender.parry) / 2;
  }

  const roll = Math.random();
  const isHit = roll < hitRate;

  const move = randomElem(MOVES);
  const part = randomElem(BODY_PARTS);
  const attackerName = attacker.name;
  const defenderName = defender.name;

  let desc = '';

  // Log Skill Cast
  if (skill) {
    desc += `【${skillName}】发动！`;
  }

  if (isHit) {
    // Add Shi if Basic Attack
    if (!skill) {
        state.player.resources.shi++;
    }

    // Damage Split
    const intRatio = attacker.internalRatio / 100;
    const extRatio = 1 - intRatio;

    // External Calc
    const ratioExt = effectiveAttacker.penetration / defender.resistance;
    const decayExt = calculateDecay(ratioExt);
    const dmgExt = BASE_DAMAGE * extRatio * ratioExt * decayExt;

    // Internal Calc
    const ratioInt = effectiveAttacker.qiBreach / defender.qiGuard;
    const decayInt = calculateDecay(ratioInt);
    const dmgInt = BASE_DAMAGE * intRatio * ratioInt * decayInt;

    const totalDmg = parseFloat((dmgExt + dmgInt).toFixed(1));

    if (skill) {
      desc += `${attackerName}使出一招【${skillName}】，命中${defenderName}的${part}！`;
    } else {
      desc += `${attackerName}攻击${defenderName}的${part}！`;
    }
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 造成 ${totalDmg} 伤害`;

    let poolName = 'enemyDamagePool';
    state.combatState[poolName] += totalDmg;

    let newMarks = 0;
    while (state.combatState[poolName] >= MAX_HEALTH_POOL) {
      state.combatState[poolName] -= MAX_HEALTH_POOL;
      newMarks++;
    }

    if (newMarks > 0) {
        state.combatState.enemyMarks += newMarks;
        desc += `，对手伤重 (+${newMarks}标记)`;
    }
  } else {
    if (skill) {
      desc += `${attackerName}使出一招【${skillName}】，意图攻击${defenderName}的${part}。`;
    } else {
      desc += `${attackerName}攻击${defenderName}的${part}。`;
    }
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 被化解了！`;
  }

  addCombatLog(desc);
}

export function resolveEnemyAttack(attacker, defender) {
  // Check Player Protection Skill
  const protectionSkills = state.player.equipment.protection;
  let skill = null;

  const usableSkills = protectionSkills
    .map(id => KUNGFU_DEFINITIONS[id])
    .filter(def => def && state.player.resources.tiqi >= def.costTiQi);

  if (usableSkills.length > 0) {
    skill = randomElem(usableSkills);
    state.player.resources.tiqi -= skill.costTiQi;
  }

  let hitRate = 0;
  if (attacker.power > defender.parry) {
    hitRate = attacker.power / defender.parry;
  } else {
    hitRate = (attacker.power / defender.parry) / 2;
  }

  const roll = Math.random();
  const isHit = roll < hitRate;

  const move = randomElem(MOVES);
  const part = randomElem(BODY_PARTS);
  const attackerName = attacker.name;
  const defenderName = defender.name;

  let desc = '';
  if (isHit) {
    const intRatio = attacker.internalRatio / 100;
    const extRatio = 1 - intRatio;

    const ratioExt = attacker.penetration / defender.resistance;
    const decayExt = calculateDecay(ratioExt);
    const dmgExt = BASE_DAMAGE * extRatio * ratioExt * decayExt;

    const ratioInt = attacker.qiBreach / defender.qiGuard;
    const decayInt = calculateDecay(ratioInt);
    const dmgInt = BASE_DAMAGE * intRatio * ratioInt * decayInt;

    let totalDmg = parseFloat((dmgExt + dmgInt).toFixed(1));

    // Apply Protection Skill Reduction
    if (skill && skill.effect && skill.effect.damageReduction) {
        const reduced = totalDmg * (1 - skill.effect.damageReduction);
        desc += `【${skill.name}】护体！伤害 ${totalDmg} -> ${reduced.toFixed(1)}。`;
        totalDmg = parseFloat(reduced.toFixed(1));
    }

    desc += `${attackerName}攻击${defenderName}的${part}！`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 造成 ${totalDmg} 伤害`;

    let poolName = 'playerDamagePool';
    state.combatState[poolName] += totalDmg;

    let newMarks = 0;
    while (state.combatState[poolName] >= MAX_HEALTH_POOL) {
      state.combatState[poolName] -= MAX_HEALTH_POOL;
      newMarks++;
    }

    if (newMarks > 0) {
        state.combatState.playerMarks += newMarks;
        desc += `，你伤重 (+${newMarks}标记)`;
    }
  } else {
    desc += `${attackerName}攻击${defenderName}的${part}。`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 被化解了！`;
  }

  addCombatLog(desc);
}

export function checkEndCombat() {
  if (state.combatState.playerMarks >= 12) {
    endCombat(false);
    return true;
  }
  if (state.combatState.enemyMarks >= 12) {
    endCombat(true);
    return true;
  }
  return false;
}

function endCombat(playerWin) {
  state.combatState.inCombat = false;
  state.combatState.phase = 'result';
  state.combatState.skipping = false;

  const resultText = playerWin ? '战胜' : '败给';
  const enemyStats = state.combatState.enemy;
  let enemyName = enemyStats.name;

  // 构建敌人描述（包含称号和门派）
  if (enemyStats.title) {
    enemyName = `${enemyStats.title} ${enemyStats.name}`;
  }
  if (enemyStats.faction) {
    enemyName += ` (${enemyStats.faction})`;
  }

  const report = {
    id: Date.now(),
    timestamp: new Date().toLocaleString(),
    enemyName: enemyName,
    result: playerWin ? '胜利' : '失败',
    logs: [...state.combatState.currentBattleLogs]
  };

  state.battleReports.unshift(report);
  if (state.battleReports.length > 10) {
    state.battleReports.pop();
  }

  const summary = `战斗结束！你${resultText}了 ${enemyName}！`;
  addCombatLog(summary);
  addLog(summary, 'combat', { reportId: report.id });
}

// --- ECS 桥接导出 ---
// 导出GameBridge以便UI组件可以访问ECS系统
export { getGameBridge } from './ecs/GameBridge';

// 导出ECS常量（供测试和外部使用）
export { COMBAT_CONSTANTS, QI_CONSTANTS, ESTATE_CONSTANTS } from './ecs/GameBridge';
