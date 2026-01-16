import { reactive, watch, computed } from 'vue';
import { loadGlobalData, saveGlobalData } from './utils/storage';
import { KUNGFU_DEFINITIONS, DEFAULT_INVENTORY } from './data/kungfu';

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

// Neili Types Definition
// [Type Name]: [Power/Parry, Pen/Res, QiBreach/Guard]
export const NEILI_TYPES = {
  '金刚': [10, 16, 4],
  '紫霞': [4, 6, 14],
  '玄阴': [4, 4, 16],
  '纯阳': [6, 10, 10],
  '归元': [6, 14, 6],
  '混元': [6, 10, 10],
};

// Initial Player State Template
const defaultPlayerState = {
  name: '',
  basePower: 50,
  baseParry: 50,
  basePenetration: 50,
  baseResistance: 50,
  baseQiBreach: 50,
  baseQiGuard: 50,
  qi: 80,
  qiDestruction: 0,
  qiProtection: 0,
  neiliType: '混元',
  internalRatio: 0,

  // KungFu System
  inventory: [...DEFAULT_INVENTORY],
  equipment: {
    internal: null,
    destruction: [],
    protection: [],
  },
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
export const effectiveStats = computed(() => {
  const p = state.player;
  const multipliers = NEILI_TYPES[p.neiliType] || NEILI_TYPES['混元'];

  return {
    power: p.basePower + (p.qiDestruction * multipliers[0]),
    parry: p.baseParry + (p.qiProtection * multipliers[0]),
    penetration: p.basePenetration + (p.qiDestruction * multipliers[1]),
    resistance: p.baseResistance + (p.qiProtection * multipliers[1]),
    qiBreach: p.baseQiBreach + (p.qiDestruction * multipliers[2]),
    qiGuard: p.baseQiGuard + (p.qiProtection * multipliers[2]),
  };
});

// Computed Slots Capacity
export const slotCapacity = computed(() => {
  const internalId = state.player.equipment.internal;
  if (internalId && KUNGFU_DEFINITIONS[internalId]) {
    return KUNGFU_DEFINITIONS[internalId].slots;
  }
  return { destruction: 0, protection: 0 };
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
  newPlayer.basePower = randomInt(50, 60);
  newPlayer.baseParry = randomInt(50, 60);
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
  if (!state.player.equipment) state.player.equipment = { internal: null, destruction: [], protection: [] };
  if (!state.player.resources) state.player.resources = { shi: 0, tiqi: 0 };

  state.logs = JSON.parse(JSON.stringify(slotData.logs));
  state.battleReports = JSON.parse(JSON.stringify(slotData.battleReports || []));

  // Reset combat state
  state.combatState = {
    inCombat: false,
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
  const allIds = Object.keys(KUNGFU_DEFINITIONS);
  const randomId = randomElem(allIds);
  state.player.inventory.push(randomId);
  addLog(`你研读经书，领悟了【${KUNGFU_DEFINITIONS[randomId].name}】！`, 'growth');
}

export function equipKungFu(kfId) {
  const def = KUNGFU_DEFINITIONS[kfId];
  if (!def) return;

  if (def.type === 'internal') {
    state.player.equipment.internal = kfId;
    // Reset other slots if they exceed capacity?
    // Ideally yes, but let's keep it simple for now or enforce on validation.
    // Let's enforce simply: clear other slots to be safe or just truncate.
    const cap = def.slots;
    if (state.player.equipment.destruction.length > cap.destruction) {
        state.player.equipment.destruction.length = cap.destruction;
    }
    if (state.player.equipment.protection.length > cap.protection) {
        state.player.equipment.protection.length = cap.protection;
    }
    addLog(`装备了内功【${def.name}】。`);
  } else if (def.type === 'destruction') {
    const cap = slotCapacity.value.destruction;
    if (state.player.equipment.destruction.length < cap) {
        state.player.equipment.destruction.push(kfId);
        addLog(`装备了催破【${def.name}】。`);
    } else {
        addLog(`催破槽位已满！`);
    }
  } else if (def.type === 'protection') {
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
        state.player.equipment.internal = null;
        state.player.neiliType = '混元'; // Reset neili on unequip? Or keep last?
        // User said: "Equip internal + Meditate => Change Neili".
        // If unequip, maybe keep current or reset? Reset seems logical.
        addLog(`卸下了内功。`);
    } else {
        state.player.equipment[type].splice(index, 1);
        addLog(`卸下了功法。`);
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

  // Update Neili Type based on equipped Internal KungFu
  const equippedInternal = state.player.equipment.internal;
  if (equippedInternal && KUNGFU_DEFINITIONS[equippedInternal]) {
    const newType = KUNGFU_DEFINITIONS[equippedInternal].neiliType;
    if (state.player.neiliType !== newType) {
        state.player.neiliType = newType;
        addLog(`运转【${KUNGFU_DEFINITIONS[equippedInternal].name}】，内力属性转为【${newType}】！`, 'growth');
    }
  }

  if (state.player.qi >= MAX_QI) {
    addLog(`真气充盈，已达瓶颈 (${MAX_QI})，无法继续精进。`, 'system');
    return;
  }

  const gain = 1;
  state.player.qi = Math.min(state.player.qi + gain, MAX_QI);

  addLog(`你运转周天，丹田温热，真气上限提升至 ${state.player.qi}。`, 'growth');
}

export function allocateQi(type, amount) {
  if (amount > 0) {
    const used = state.player.qiDestruction + state.player.qiProtection;
    if (used < state.player.qi) {
      if (type === 'destruction') state.player.qiDestruction++;
      if (type === 'protection') state.player.qiProtection++;
    }
  } else {
    if (type === 'destruction' && state.player.qiDestruction > 0) state.player.qiDestruction--;
    if (type === 'protection' && state.player.qiProtection > 0) state.player.qiProtection--;
  }
}

// Function to calculate Damage Decay based on ratio
function calculateDecay(ratio) {
  // y = 12.51 / (12.51 + x)
  return 12.51 / (12.51 + ratio);
}

export async function startCombat() {
  if (state.combatState.inCombat) return;

  const playerTotalQi = state.player.qi;
  const enemyQi = Math.max(0, Math.floor(playerTotalQi * (0.9 + Math.random() * 0.2)));
  const enemyDestruction = randomInt(0, enemyQi);
  const enemyProtection = enemyQi - enemyDestruction;
  const enemyName = generateName() + ' (对手)';

  const eBase = {
    power: randomInt(50, 60),
    parry: randomInt(50, 60),
    penetration: randomInt(50, 60),
    resistance: randomInt(50, 60),
    qiBreach: randomInt(50, 60),
    qiGuard: randomInt(50, 60),
  };

  const enemyTypes = Object.keys(NEILI_TYPES);
  const enemyType = randomElem(enemyTypes);
  const enemyMultipliers = NEILI_TYPES[enemyType];

  const enemyStats = {
    name: enemyName,
    neiliType: enemyType,
    power: eBase.power + (enemyDestruction * enemyMultipliers[0]),
    parry: eBase.parry + (enemyProtection * enemyMultipliers[0]),
    penetration: eBase.penetration + (enemyDestruction * enemyMultipliers[1]),
    resistance: eBase.resistance + (enemyProtection * enemyMultipliers[1]),
    qiBreach: eBase.qiBreach + (enemyDestruction * enemyMultipliers[2]),
    qiGuard: eBase.qiGuard + (enemyProtection * enemyMultipliers[2]),
    internalRatio: randomInt(0, 100),
  };

  state.combatState.inCombat = true;
  state.combatState.skipping = false;
  state.combatState.enemy = enemyStats;
  state.combatState.playerMarks = 0;
  state.combatState.enemyMarks = 0;
  state.combatState.playerDamagePool = 0;
  state.combatState.enemyDamagePool = 0;
  state.combatState.round = 0;
  state.combatState.currentBattleLogs = [];

  // Init Combat Resources
  state.player.resources.shi = 0;
  state.player.resources.tiqi = 0;

  addLog(`遭遇了 ${enemyName}！战斗开始！`, 'combat');
  addCombatLog(`遭遇了 ${enemyName}！(真气:${enemyQi} - 摧破:${enemyDestruction}/护体:${enemyProtection})`);
  addCombatLog(`敌方属性 [${enemyType}] - 力:${enemyStats.power} 卸:${enemyStats.parry}`);
  addCombatLog(`内伤占比: ${enemyStats.internalRatio}%`);

  combatLoop();
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

function resolvePlayerAttack(attacker, defender) {
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

  // Standard Resolution
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
        // Cap Shi? Maybe 10? User didn't specify. Let's keep it unlimited or logical cap.
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

    desc += `${attackerName}使出一招【${move}】，命中${defenderName}的${part}！`;
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
    desc += `${attackerName}使出一招【${move}】，意图攻击${defenderName}的${part}。`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 被化解了！`;
  }

  addCombatLog(desc);
}

function resolveEnemyAttack(attacker, defender) {
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
    // Enemy assumes simplified calc (no separate int/ext for enemy yet, using same ratio as player for simplicity? Or just enemy.internalRatio)
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

    desc += `${attackerName}使出一招【${move}】，命中${defenderName}的${part}！`;
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
    desc += `${attackerName}使出一招【${move}】，意图攻击${defenderName}的${part}。`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 被化解了！`;
  }

  addCombatLog(desc);
}

function checkEndCombat() {
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
  state.combatState.skipping = false;

  const resultText = playerWin ? '战胜' : '败给';
  const enemyName = state.combatState.enemy.name;

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
