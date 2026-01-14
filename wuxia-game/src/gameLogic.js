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
    power: 10, // 力道
    parry: 10, // 卸力
    penetration: 10, // 破体
    resistance: 10, // 御体
  },
  logs: [], // { id, text, type }
};

export const state = reactive({
  player: { ...defaultState.player },
  logs: [],
  combatState: {
    inCombat: false,
    enemy: null,
    playerMarks: 0,
    enemyMarks: 0,
    playerDamagePool: 0, // Accumulated damage taken
    enemyDamagePool: 0, // Accumulated damage taken
    round: 0,
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

// Add Log
function addLog(text, type = 'system') {
  const logEntry = {
    id: Date.now() + Math.random(),
    text,
    type,
    timestamp: new Date().toLocaleTimeString(),
  };
  state.logs.unshift(logEntry);
  if (state.logs.length > 200) {
    state.logs.pop();
  }
}

// Initialize / Load Game
export function initGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure backwards compatibility by merging with default
      state.player = { ...defaultState.player, ...parsed.player };
      // If new fields are missing (undefined), set them to default
      if (!state.player.penetration) state.player.penetration = 10;
      if (!state.player.resistance) state.player.resistance = 10;

      state.logs = parsed.logs || [];
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
    () => ({ player: state.player, logs: state.logs }),
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
    power: randomInt(10, 20),
    parry: randomInt(10, 20),
    penetration: randomInt(10, 20),
    resistance: randomInt(10, 20),
  };
  state.logs = [];
  addLog(`初入江湖，你的名字是 ${state.player.name}。`);
  addLog(`初始属性 - 力道: ${state.player.power}, 卸力: ${state.player.parry}, 破体: ${state.player.penetration}, 御体: ${state.player.resistance}`);
}

// Growth Action
export function train() {
  if (state.combatState.inCombat) return;

  // Randomly increase stats
  let trained = false;
  if (Math.random() < 0.5) { state.player.power++; trained = true; }
  if (Math.random() < 0.5) { state.player.parry++; trained = true; }
  if (Math.random() < 0.5) { state.player.penetration++; trained = true; }
  if (Math.random() < 0.5) { state.player.resistance++; trained = true; }

  // Guarantee at least one stat if bad luck
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

  // Generate Enemy
  // Enemy stats scale with player (0.8 to 1.2)
  const enemyName = generateName() + ' (对手)';
  const scale = 0.8 + Math.random() * 0.4;
  const enemyPower = Math.floor(state.player.power * scale);
  const enemyParry = Math.floor(state.player.parry * scale);
  const enemyPenetration = Math.floor(state.player.penetration * scale);
  const enemyResistance = Math.floor(state.player.resistance * scale);

  state.combatState.inCombat = true;
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

  addLog(`遭遇了 ${enemyName}！战斗开始！(敌方 力:${enemyPower} 卸:${enemyParry} 破:${enemyPenetration} 御:${enemyResistance})`, 'combat');

  await combatLoop();
}

async function combatLoop() {
  while (state.combatState.inCombat) {
    state.combatState.round++;
    await new Promise(r => setTimeout(r, 1000)); // Delay for readability

    // Player attacks Enemy
    await resolveAttack(state.player, state.combatState.enemy, true);
    if (checkEndCombat()) break;

    await new Promise(r => setTimeout(r, 1000));

    // Enemy attacks Player
    await resolveAttack(state.combatState.enemy, state.player, false);
    if (checkEndCombat()) break;
  }
}

async function resolveAttack(attacker, defender, isPlayerAttacking) {
  const attackerName = isPlayerAttacking ? '你' : attacker.name;
  const defenderName = isPlayerAttacking ? defender.name : '你';

  // 1. Calculate Hit Rate
  let hitRate = 0;
  if (attacker.power > defender.parry) {
    hitRate = attacker.power / defender.parry;
  } else {
    hitRate = (attacker.power / defender.parry) / 2;
  }

  // 2. Roll for Hit
  const roll = Math.random();
  const isHit = roll < hitRate;

  const move = randomElem(MOVES);
  const part = randomElem(BODY_PARTS);

  let desc = '';
  if (isHit) {
    // 3. Calculate Damage
    // Formula: Ratio x = Pen/Res. Decay y = 12.51 / (12.51 + x). Factor = x * y.
    // Damage = Base * Factor.
    const ratio = attacker.penetration / defender.resistance;
    const decay = 12.51 / (12.51 + ratio);
    const damage = BASE_DAMAGE * ratio * decay;
    const finalDamage = parseFloat(damage.toFixed(1));

    desc = `${attackerName}使出一招【${move}】，命中${defenderName}的${part}！`;
    desc += ` (命中率 ${(hitRate*100).toFixed(0)}%) -> 造成 ${finalDamage} 点伤害。`;

    // 4. Apply Damage to Pool
    let poolName = isPlayerAttacking ? 'enemyDamagePool' : 'playerDamagePool';
    state.combatState[poolName] += finalDamage;

    // 5. Check Threshold
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

  addLog(desc, 'combat');
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
  if (playerWin) {
    addLog(`战斗结束！你战胜了 ${state.combatState.enemy.name}！`, 'combat');
  } else {
    addLog(`战斗结束！你不敌 ${state.combatState.enemy.name}，败下阵来...`, 'combat');
  }
}
