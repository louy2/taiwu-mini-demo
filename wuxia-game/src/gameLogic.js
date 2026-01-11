import { reactive, watch } from 'vue';

const STORAGE_KEY = 'wuxia_game_data';

// Wuxia Terminology
const SURNAMES = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '独孤', '令狐', '西门', '东方', '慕容', '上官', '南宫'];
const NAMES = ['逍遥', '无忌', '寻欢', '吹雪', '不败', '留香', '灵珊', '盈盈', '语嫣', '靖', '康', '过', '龙', '峰', '誉', '竹', '梅', '兰', '菊', '风', '云', '霜', '雪', '剑', '刀', '行', '天', '问'];

const METHODS = ['站桩', '冥想', '挥剑', '打坐', '举石', '听瀑', '观云', '读经'];
const BODY_PARTS = ['胸口', '左肩', '右臂', '下盘', '背心', '面门'];
const MOVES = ['黑虎掏心', '白鹤亮翅', '太极推手', '亢龙有悔', '落英神剑', '一阳指', '独孤九剑', '天外飞仙'];

// Initial State
const defaultState = {
  player: {
    name: '',
    power: 10, // 力道
    parry: 10, // 卸力
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
    round: 0,
    combatLogs: [], // Temporary logs for the current combat? Or just push to main logs?
                    // User said "Growth log and Combat log also archived".
                    // So I will push everything to the main persistent log.
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
      state.player = parsed.player;
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
  };
  state.logs = [];
  addLog(`初入江湖，你的名字是 ${state.player.name}。`);
  addLog(`初始属性 - 力道: ${state.player.power}, 卸力: ${state.player.parry}`);
}

// Growth Action
export function train() {
  if (state.combatState.inCombat) return;

  const gainPower = Math.random() < 0.5 ? 1 : 0;
  const gainParry = Math.random() < 0.5 ? 1 : 0;

  if (gainPower === 0 && gainParry === 0) {
    // Bad luck protection, ensure at least some gain or just a flavor text failure?
    // Let's guarantee at least 1 point in something usually, or small chance of nothing.
    // Let's just force at least 1 stat gain to make it feel good.
    if (Math.random() < 0.5) state.player.power++;
    else state.player.parry++;
  } else {
    state.player.power += gainPower;
    state.player.parry += gainParry;
  }

  const method = randomElem(METHODS);
  addLog(`你进行了${method}，力道提升至 ${state.player.power}，卸力提升至 ${state.player.parry}。`, 'growth');
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

  state.combatState.inCombat = true;
  state.combatState.enemy = { name: enemyName, power: enemyPower, parry: enemyParry };
  state.combatState.playerMarks = 0;
  state.combatState.enemyMarks = 0;
  state.combatState.round = 0;

  addLog(`遭遇了 ${enemyName}！战斗开始！(敌方 力道:${enemyPower} 卸力:${enemyParry})`, 'combat');

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
  // Hit Formula: Atk / (Atk + Def)
  const hitRate = attacker.power / (attacker.power + defender.parry);
  const roll = Math.random();
  const isHit = roll < hitRate;

  const move = randomElem(MOVES);
  const part = randomElem(BODY_PARTS);
  const attackerName = isPlayerAttacking ? '你' : attacker.name;
  const defenderName = isPlayerAttacking ? defender.name : '你';

  let desc = '';
  if (isHit) {
    desc = `${attackerName}使出一招【${move}】，直取${defenderName}的${part}！`;
    desc += ` (命中率 ${(hitRate*100).toFixed(1)}%) -> 命中！`;

    if (isPlayerAttacking) {
      state.combatState.enemyMarks++;
      desc += ` 对手增加1个受伤标记 (累计 ${state.combatState.enemyMarks}/12)`;
    } else {
      state.combatState.playerMarks++;
      desc += ` 你增加1个受伤标记 (累计 ${state.combatState.playerMarks}/12)`;
    }
  } else {
    desc = `${attackerName}使出一招【${move}】，意图攻击${defenderName}的${part}。`;
    desc += ` (命中率 ${(hitRate*100).toFixed(1)}%) -> 被化解了！`;
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
