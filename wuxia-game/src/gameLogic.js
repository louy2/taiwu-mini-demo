import { reactive, watch } from 'vue';

const STORAGE_KEY = 'wuxia_game_data';

// Wuxia Terminology
const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '独孤', '令狐', '西门', '东方', '慕容', '上官', '南宫'];
const NAMES = ['逍遥', '无忌', '寻欢', '吹雪', '不败', '留香', '灵珊', '盈盈', '语嫣', '靖', '康', '过', '龙', '峰', '誉', '竹', '梅', '兰', '菊', '风', '云', '霜', '雪', '剑', '刀', '行', '天', '问'];

const METHODS = ['站桩', '冥想', '挥剑', '打坐', '举石', '听瀑', '观云', '读经'];
const BODY_PARTS = ['胸口', '左肩', '右臂', '下盘', '背心', '面门'];
const MOVES = ['黑虎掏心', '白鹤亮翅', '太极推手', '亢龙有悔', '落英神剑', '一阳指', '独孤九剑', '天外飞仙'];

// Constants
const BASE_DAMAGE = 9;
const MAX_HEALTH_POOL = 200;

// Initial State
const defaultState = {
  player: {
    name: '',
    power: 250, // 力道
    parry: 250, // 卸力
    penetration: 250, // 破体
    resistance: 250, // 御体
  },
  logs: [], // { id, text, type }
  battleReports: [], // { id, timestamp, enemyName, result, logs: [] }
};

export const state = reactive({
  player: { ...defaultState.player },
  logs: [],
  battleReports: [],
  combatState: {
    inCombat: false,
    skipping: false, // Flag to indicate skip mode
    enemy: null,
    playerMarks: 0,
    enemyMarks: 0,
    playerDamagePool: 0,
    enemyDamagePool: 0,
    round: 0,
    currentBattleLogs: [], // Temporary storage for current battle
  }
});

// Helper: Random Integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random Element
function randomElem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate Name
function generateName() {
  return randomElem(SURNAMES) + randomElem(NAMES);
}

// Add Main Log (System/Growth/Battle Result)
function addLog(text, type = 'system') {
  const logEntry = {
    id: Date.now() + Math.random(),
    text,
    type,
    timestamp: new Date().toLocaleTimeString(),
  };
  state.logs.unshift(logEntry);
  // User requested "Complete retention" for main logs, so we remove the limit.
  // Caveat: localStorage has a size limit (usually 5MB).
  // Eventually this will need a cleanup strategy, but for now we obey "Complete".
}

// Add Combat Log (To current battle report)
function addCombatLog(text) {
  const logEntry = {
    text,
    timestamp: new Date().toLocaleTimeString(),
  };
  state.combatState.currentBattleLogs.push(logEntry);
}

// Initialize / Load Game
export function initGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.player = { ...defaultState.player, ...parsed.player };
      // Default fallback for new stats if missing
      if (!state.player.penetration) state.player.penetration = 250;
      if (!state.player.resistance) state.player.resistance = 250;
      // If power/parry are suspiciously low (old save), boost them?
      // No, user said "Initial" adjusted. Existing saves can train up.

      state.logs = parsed.logs || [];
      state.battleReports = parsed.battleReports || [];
      addLog('欢迎回来，侠士 ' + state.player.name);
    } catch (e) {
      console.error('Save file corrupted', e);
      resetGame();
    }
  } else {
    resetGame();
  }

  // Auto-save watcher
  watch(
    () => ({ player: state.player, logs: state.logs, battleReports: state.battleReports }),
    (newVal) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
    },
    { deep: true }
  );
}

// Reset / New Game
export function resetGame() {
  state.player = {
    name: generateName(),
    power: randomInt(250, 260),
    parry: randomInt(250, 260),
    penetration: randomInt(250, 260),
    resistance: randomInt(250, 260),
  };
  state.logs = [];
  state.battleReports = [];
  addLog(`初入江湖，你的名字是 ${state.player.name}。`);
  addLog(`初始属性 - 力道: ${state.player.power}, 卸力: ${state.player.parry}, 破体: ${state.player.penetration}, 御体: ${state.player.resistance}`);
}

// Growth Action
export function train() {
  if (state.combatState.inCombat) return;

  let trained = false;
  if (Math.random() < 0.5) { state.player.power++; trained = true; }
  if (Math.random() < 0.5) { state.player.parry++; trained = true; }
  if (Math.random() < 0.5) { state.player.penetration++; trained = true; }
  if (Math.random() < 0.5) { state.player.resistance++; trained = true; }

  if (!trained) {
    const roll = Math.random();
    if (roll < 0.25) state.player.power++;
    else if (roll < 0.5) state.player.parry++;
    else if (roll < 0.75) state.player.penetration++;
    else state.player.resistance++;
  }

  const method = randomElem(METHODS);
  addLog(`你进行了${method}，属性提升！(力:${state.player.power} 卸:${state.player.parry} 破:${state.player.penetration} 御:${state.player.resistance})`, 'growth');
}

// Combat Logic
export async function startCombat() {
  if (state.combatState.inCombat) return;

  const enemyName = generateName() + ' (对手)';
  const scale = 0.8 + Math.random() * 0.4;
  const enemyPower = Math.floor(state.player.power * scale);
  const enemyParry = Math.floor(state.player.parry * scale);
  const enemyPenetration = Math.floor(state.player.penetration * scale);
  const enemyResistance = Math.floor(state.player.resistance * scale);

  state.combatState.inCombat = true;
  state.combatState.skipping = false;
  state.combatState.enemy = {
    name: enemyName,
    power: enemyPower,
    parry: enemyParry,
    penetration: enemyPenetration,
    resistance: enemyResistance
  };

  state.combatState.playerMarks = 0;
  state.combatState.enemyMarks = 0;
  state.combatState.playerDamagePool = 0;
  state.combatState.enemyDamagePool = 0;
  state.combatState.round = 0;
  state.combatState.currentBattleLogs = [];

  addLog(`遭遇了 ${enemyName}！战斗开始！`, 'combat'); // Main log only shows start
  addCombatLog(`遭遇了 ${enemyName}！(敌方 力:${enemyPower} 卸:${enemyParry} 破:${enemyPenetration} 御:${enemyResistance})`);

  // Start the loop (async)
  combatLoop();
}

// Skip Function
export function skipCombat() {
  if (!state.combatState.inCombat) return;
  state.combatState.skipping = true;
  // The loop will pick up this flag and finish instantly
}

async function combatLoop() {
  while (state.combatState.inCombat) {
    state.combatState.round++;

    // If not skipping, wait. If skipping, don't wait.
    if (!state.combatState.skipping) {
      await new Promise(r => setTimeout(r, 1000));
    }

    // Player attacks Enemy
    resolveAttack(state.player, state.combatState.enemy, true);
    if (checkEndCombat()) break;

    if (!state.combatState.skipping) {
      await new Promise(r => setTimeout(r, 1000));
    }

    // Enemy attacks Player
    resolveAttack(state.combatState.enemy, state.player, false);
    if (checkEndCombat()) break;
  }
}

function resolveAttack(attacker, defender, isPlayerAttacking) {
  const attackerName = isPlayerAttacking ? '你' : attacker.name;
  const defenderName = isPlayerAttacking ? defender.name : '你';

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

    desc = `${attackerName}使出一招【${move}】，命中${defenderName}的${part}！`;
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
    desc = `${attackerName}使出一招【${move}】，意图攻击${defenderName}的${part}。`;
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
  addLog(summary, 'combat'); // Main log
  addCombatLog(summary); // Battle log

  // Save Battle Report
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
