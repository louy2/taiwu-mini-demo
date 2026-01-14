import { reactive, watch, computed } from 'vue';
import { loadGlobalData, saveGlobalData } from './utils/storage';

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
};

// Global App State
export const globalState = reactive({
  slots: [null, null, null],
  activeSlotIndex: -1, // -1 means in menu
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
  return {
    power: p.basePower + (p.qiDestruction * 6),
    parry: p.baseParry + (p.qiProtection * 6),
    penetration: p.basePenetration + (p.qiDestruction * 6),
    resistance: p.baseResistance + (p.qiProtection * 6),
    qiBreach: p.baseQiBreach + (p.qiDestruction * 10),
    qiGuard: p.baseQiGuard + (p.qiProtection * 10),
  };
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
  const newPlayer = {
    ...defaultPlayerState,
    name: generateName(),
    basePower: randomInt(50, 60),
    baseParry: randomInt(50, 60),
    basePenetration: randomInt(50, 60),
    baseResistance: randomInt(50, 60),
    baseQiBreach: randomInt(50, 60),
    baseQiGuard: randomInt(50, 60),
  };

  const saveObj = {
    player: newPlayer,
    logs: [
      { id: Date.now(), text: `初入江湖，你的名字是 ${newPlayer.name}。`, type: 'system', timestamp: new Date().toLocaleTimeString() },
      { id: Date.now()+1, text: `真气流转，初始真气 ${newPlayer.qi}。请分配真气以增强实力。`, type: 'system', timestamp: new Date().toLocaleTimeString() }
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

// --- GAME ACTIONS ---

function addLog(text, type = 'system') {
  const logEntry = {
    id: Date.now() + Math.random(),
    text,
    type,
    timestamp: new Date().toLocaleTimeString(),
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
  };

  const enemyStats = {
    name: enemyName,
    power: eBase.power + (enemyDestruction * 6),
    parry: eBase.parry + (enemyProtection * 6),
    penetration: eBase.penetration + (enemyDestruction * 6),
    resistance: eBase.resistance + (enemyProtection * 6),
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

  addLog(`遭遇了 ${enemyName}！战斗开始！`, 'combat');
  addCombatLog(`遭遇了 ${enemyName}！(真气:${enemyQi} - 摧破:${enemyDestruction}/护体:${enemyProtection})`);
  addCombatLog(`敌方属性 - 力:${enemyStats.power} 卸:${enemyStats.parry} 破:${enemyStats.penetration} 御:${enemyStats.resistance}`);

  combatLoop();
}

export function skipCombat() {
  if (!state.combatState.inCombat) return;
  state.combatState.skipping = true;
}

async function combatLoop() {
  while (state.combatState.inCombat) {
    state.combatState.round++;

    if (!state.combatState.skipping) await new Promise(r => setTimeout(r, 1000));

    const pStats = effectiveStats.value;
    const eStats = state.combatState.enemy;

    // Player attacks Enemy
    resolveAttack(pStats, eStats, true, state.player.name, eStats.name);
    if (checkEndCombat()) break;

    if (!state.combatState.skipping) await new Promise(r => setTimeout(r, 1000));

    // Enemy attacks Player
    resolveAttack(eStats, pStats, false, eStats.name, state.player.name);
    if (checkEndCombat()) break;
  }
}

function resolveAttack(attacker, defender, isPlayerAttacking, attName, defName) {
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

  let desc = '';
  if (isHit) {
    const ratio = attacker.penetration / defender.resistance;
    const decay = 12.51 / (12.51 + ratio);
    const damage = BASE_DAMAGE * ratio * decay;
    const finalDamage = parseFloat(damage.toFixed(1));

    desc = `${attName}使出一招【${move}】，命中${defName}的${part}！`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 造成 ${finalDamage} 点伤害。`;

    let poolName = isPlayerAttacking ? 'enemyDamagePool' : 'playerDamagePool';
    state.combatState[poolName] += finalDamage;

    let newMarks = 0;
    while (state.combatState[poolName] >= MAX_HEALTH_POOL) {
      state.combatState[poolName] -= MAX_HEALTH_POOL;
      newMarks++;
    }

    if (newMarks > 0) {
      if (isPlayerAttacking) {
        state.combatState.enemyMarks += newMarks;
        desc += ` 对手伤势加重，增加${newMarks}个受伤标记 (累计 ${state.combatState.enemyMarks}/12)`;
      } else {
        state.combatState.playerMarks += newMarks;
        desc += ` 你伤势加重，增加${newMarks}个受伤标记 (累计 ${state.combatState.playerMarks}/12)`;
      }
    }
  } else {
    desc = `${attName}使出一招【${move}】，意图攻击${defName}的${part}。`;
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

  const summary = `战斗结束！你${resultText}了 ${enemyName}！`;
  addLog(summary, 'combat');
  addCombatLog(summary);

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
}
