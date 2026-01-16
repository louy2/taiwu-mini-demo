<template>
  <div class="app-container">

    <!-- === MAIN MENU VIEW === -->
    <div v-if="globalState.activeSlotIndex === -1" class="menu-view">
      <h1 class="menu-title">放置随机武侠</h1>
      <div class="slot-list">
        <div v-for="(slot, idx) in globalState.slots" :key="idx" class="slot-item">
          <div v-if="slot" class="slot-content filled" @click="handleLoad(idx)">
            <div class="slot-name">{{ slot.player.name }}</div>
            <div class="slot-info">上次: {{ new Date(slot.lastPlayed).toLocaleString() }}</div>
          </div>
          <div v-else class="slot-content empty" @click="handleCreate(idx)">
            <span>[ 新建存档 ]</span>
          </div>
          <button v-if="slot" class="delete-btn" @click.stop="handleDelete(idx)">×</button>
        </div>
      </div>
    </div>

    <!-- === GAME VIEW === -->
    <div v-else class="game-view">

      <!-- 1. TOP STATUS BAR (2 Lines) -->
      <header class="status-bar">
        <!-- Combat Mode -->
        <div v-if="state.combatState.inCombat" class="status-content combat">
          <div class="status-line">
            <span class="name">{{ state.player.name }}</span>
            <div class="hp-bar-container">
              <div class="hp-bar player" :style="{ width: playerHpPct + '%' }"></div>
            </div>
            <span class="marks">{{ state.combatState.playerMarks }}/12</span>
            <span class="res-mini">势{{state.player.resources.shi}}/提{{Math.floor(state.player.resources.tiqi/1000)}}k</span>
          </div>
          <div class="status-line">
            <span class="name enemy">{{ state.combatState.enemy.name }}</span>
            <div class="hp-bar-container">
              <div class="hp-bar enemy" :style="{ width: enemyHpPct + '%' }"></div>
            </div>
            <span class="marks">{{ state.combatState.enemyMarks }}/12</span>
            <button class="skip-btn-mini" @click="handleSkip" v-if="!state.combatState.skipping">结束</button>
            <span v-else>...</span>
          </div>
        </div>

        <!-- Normal Mode -->
        <div v-else class="status-content normal">
          <div class="status-line">
            <span class="main-info">
              <span class="name">{{ state.player.name }}</span>
              <span class="badge">{{ state.player.neiliType }}</span>
            </span>
            <span class="qi-info">真气 {{ state.player.qi }} ({{ state.player.qiDestruction }}/{{ state.player.qiProtection }})</span>
          </div>
          <div class="status-line stats-mini">
            <span>力{{ effectiveStats.power }}</span>
            <span>卸{{ effectiveStats.parry }}</span>
            <span>破{{ effectiveStats.penetration }}/御{{ effectiveStats.resistance }}</span>
            <span>气{{ effectiveStats.qiBreach }}/守{{ effectiveStats.qiGuard }}</span>
          </div>
        </div>
      </header>

      <!-- 2. CENTRAL LOG AREA -->
      <main class="log-area" ref="logsContainer">
        <!-- Combat Live Log (Fixed at top of logs or floating? User said 'logs pop out'.
             Let's put live combat log as the most recent entry style or a sticky header inside logs.
             Actually design doc says 'Live Combat Log' component displays last 3 lines.
             Let's integrate it nicely or keep it as top overlay in combat.
             User request: "Middle is all event logs".
             I will merge combat logs into the main stream visually or keep a small overlay for live combat.
             Let's stick to standard logs for history, but maybe show live feedback overlay in combat?
             To keep it "Minimalist Reading", just auto-scroll logs.
        -->
        <div v-for="log in state.logs" :key="log.id" class="log-entry" :class="log.type">
          <span class="time">[{{ log.timestamp.split(' ')[0] }}]</span>
          <span class="text">
            {{ log.text }}
            <span v-if="log.reportId" class="link-text" @click="openReportById(log.reportId)">[查看战报]</span>
          </span>
        </div>
        <div v-if="state.logs.length === 0" class="empty-log">暂无江湖事迹...</div>
      </main>

      <!-- 3. BOTTOM DRAWER -->
      <div class="drawer-container" :class="{ open: drawerOpen }">
        <!-- Handle / Toggle Bar -->
        <div class="drawer-handle" @click="drawerOpen = !drawerOpen">
          <div class="handle-text">
            {{ drawerOpen ? '▼ 收起面板' : '▲ 行动 / 属性 / 功法' }}
          </div>
        </div>

        <!-- Drawer Content -->
        <div class="drawer-content">
          <!-- Drawer Tabs -->
          <div class="drawer-tabs">
            <button :class="{ active: drawerTab === 'action' }" @click="drawerTab = 'action'">行动</button>
            <button :class="{ active: drawerTab === 'estate' }" @click="drawerTab = 'estate'">产业</button>
            <button :class="{ active: drawerTab === 'stats' }" @click="drawerTab = 'stats'">状态</button>
            <button :class="{ active: drawerTab === 'kungfu' }" @click="drawerTab = 'kungfu'">功法</button>
            <button :class="{ active: drawerTab === 'qi' }" @click="drawerTab = 'qi'">调息</button>
            <button class="menu-btn" @click="handleBackToMenu">主页</button>
          </div>

          <!-- TAB: ACTION -->
          <div v-if="drawerTab === 'action'" class="tab-pane action-pane">
            <button @click="handleFight" :disabled="state.combatState.inCombat" class="action-btn fight">
              <span class="btn-l">战斗</span>
              <span class="btn-s">寻找对手</span>
            </button>
            <button @click="handleMeditate" :disabled="state.combatState.inCombat" class="action-btn train">
              <span class="btn-l">运转周天</span>
              <span class="btn-s">月份流转 / 产出资源</span>
            </button>
            <div class="hint-text" v-if="state.combatState.inCombat">战斗中无法进行其他行动</div>
          </div>

          <!-- TAB: ESTATE -->
          <div v-if="drawerTab === 'estate'" class="tab-pane estate-pane">
            <div class="res-bar">
               <div class="res-item">金钱: {{ state.player.money }}</div>
               <div class="res-item">威望: {{ state.player.prestige }}</div>
            </div>

            <div class="estate-row">
              <div class="building-card">
                 <div class="b-title">市集 (Lv.{{ state.player.estate.marketLevel }})</div>
                 <div class="b-desc">月产金钱: {{ state.player.estate.marketLevel * 100 }}</div>
                 <button class="up-btn" @click="handleUpgrade('market')">扩建 (-{{ state.player.estate.marketLevel * 500 }}金)</button>
                 <button class="draw-btn" @click="handleDrawEquip">淘装备 (-500金)</button>
              </div>
              <div class="building-card">
                 <div class="b-title">祠堂 (Lv.{{ state.player.estate.hallLevel }})</div>
                 <div class="b-desc">月产威望: {{ state.player.estate.hallLevel * 10 }}</div>
                 <button class="up-btn" @click="handleUpgrade('hall')">修缮 (-{{ state.player.estate.hallLevel * 50 }}威)</button>
                 <button class="draw-btn" @click="handleGachaKungFu">访名师 (-1000威)</button>
              </div>
            </div>
          </div>

          <!-- TAB: STATS -->
          <div v-if="drawerTab === 'stats'" class="tab-pane stats-pane">
            <div class="gear-section">
              <div class="gear-slot" @click="openInventory('weapon')">
                <span class="slot-label">武器</span>
                <span class="slot-val">{{ getEquippedItemName('weapon') || '未装备' }}</span>
                <span v-if="state.player.gear.weapon" class="x-btn" @click.stop="handleUnequipItem('weapon')">×</span>
              </div>
              <div class="gear-slot" @click="openInventory('armor')">
                <span class="slot-label">护甲</span>
                <span class="slot-val">{{ getEquippedItemName('armor') || '未装备' }}</span>
                <span v-if="state.player.gear.armor" class="x-btn" @click.stop="handleUnequipItem('armor')">×</span>
              </div>
            </div>
            <div class="stat-grid">
              <div class="stat-cell"><span class="label">力道</span><span class="val">{{ effectiveStats.power }}</span></div>
              <div class="stat-cell"><span class="label">卸力</span><span class="val">{{ effectiveStats.parry }}</span></div>
              <div class="stat-cell"><span class="label">破体</span><span class="val">{{ effectiveStats.penetration }}</span></div>
              <div class="stat-cell"><span class="label">御体</span><span class="val">{{ effectiveStats.resistance }}</span></div>
              <div class="stat-cell"><span class="label">破气</span><span class="val">{{ effectiveStats.qiBreach }}</span></div>
              <div class="stat-cell"><span class="label">御气</span><span class="val">{{ effectiveStats.qiGuard }}</span></div>
            </div>
            <div class="stat-row">
              <span>内伤占比设置: {{ state.player.internalRatio }}%</span>
              <input type="range" v-model.number="state.player.internalRatio" min="0" max="100" step="10" :disabled="state.combatState.inCombat">
            </div>
          </div>

          <!-- TAB: KUNGFU -->
          <div v-if="drawerTab === 'kungfu'" class="tab-pane kungfu-pane">
            <div class="kf-section">
              <div class="kf-header">内功</div>
              <div class="kf-slot full" @click="openInventory('internal')">
                {{ getEquippedName('internal') || '[ 未装备 - 点击选择 ]' }}
              </div>
            </div>
            <div class="kf-section">
              <div class="kf-header">摧破 ({{state.player.equipment.destruction.length}}/{{slotCapacity.destruction}})</div>
              <div class="kf-list">
                <div v-for="(id, idx) in state.player.equipment.destruction" :key="'d'+idx" class="kf-chip" @click="handleUnequip('destruction', idx)">
                  {{ getKfName(id) }} ×
                </div>
                <div v-if="state.player.equipment.destruction.length < slotCapacity.destruction" class="kf-chip add" @click="openInventory('destruction')">+</div>
              </div>
            </div>
            <div class="kf-section">
              <div class="kf-header">护体 ({{state.player.equipment.protection.length}}/{{slotCapacity.protection}})</div>
              <div class="kf-list">
                <div v-for="(id, idx) in state.player.equipment.protection" :key="'p'+idx" class="kf-chip" @click="handleUnequip('protection', idx)">
                  {{ getKfName(id) }} ×
                </div>
                 <div v-if="state.player.equipment.protection.length < slotCapacity.protection" class="kf-chip add" @click="openInventory('protection')">+</div>
              </div>
            </div>
          </div>

          <!-- TAB: QI -->
          <div v-if="drawerTab === 'qi'" class="tab-pane qi-pane">
             <div class="qi-row">
               <span class="qi-name">摧破加成</span>
               <div class="qi-ctrl">
                 <button @click="handleAlloc('destruction', -1)">-</button>
                 <span class="qi-val">{{ state.player.qiDestruction }}</span>
                 <button @click="handleAlloc('destruction', 1)">+</button>
               </div>
             </div>
             <div class="qi-row">
               <span class="qi-name">护体加成</span>
               <div class="qi-ctrl">
                 <button @click="handleAlloc('protection', -1)">-</button>
                 <span class="qi-val">{{ state.player.qiProtection }}</span>
                 <button @click="handleAlloc('protection', 1)">+</button>
               </div>
             </div>
             <div class="qi-remain">剩余可用: {{ state.player.qi - state.player.qiDestruction - state.player.qiProtection }}</div>
          </div>

        </div>
      </div>

      <!-- === MODALS === -->

      <!-- Battle Report Modal -->
      <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
        <div class="modal">
          <div class="modal-header">
            <h3>战报: {{ selectedReport.enemyName }}</h3>
            <button class="close-btn" @click="selectedReport = null">×</button>
          </div>
          <div class="modal-body logs-list">
            <div v-for="(log, idx) in selectedReport.logs" :key="idx" class="log-item combat">
              {{ log.text }}
            </div>
          </div>
          <div class="modal-footer">
            <span :class="{ win: selectedReport.result === '胜利', loss: selectedReport.result !== '胜利' }">
              结果: {{ selectedReport.result }}
            </span>
          </div>
        </div>
      </div>

      <!-- Inventory Modal -->
      <div v-if="inventoryModal.show" class="modal-overlay" @click.self="closeInventory">
        <div class="modal">
          <div class="modal-header">
            <h3>选择物品/功法</h3>
            <button class="close-btn" @click="closeInventory">×</button>
          </div>
          <div class="modal-body list">
             <div v-for="item in inventoryList" :key="item.id" class="list-item" @click="selectItem(item.id)">
                <div class="item-title">{{ item.name }}</div>

                <!-- KungFu Meta -->
                <template v-if="item.neiliType || item.costShi || item.costTiQi">
                    <div class="item-desc">{{ item.desc }}</div>
                    <div class="item-meta" v-if="item.type==='internal'">{{ item.neiliType }} | 摧{{item.slots.destruction}} 护{{item.slots.protection}}</div>
                    <div class="item-meta" v-if="item.type==='destruction'">耗势: {{item.costShi}}</div>
                    <div class="item-meta" v-if="item.type==='protection'">耗气: {{item.costTiQi}}</div>
                </template>

                <!-- Equipment Meta -->
                <template v-else>
                     <div class="item-meta" v-if="item.stats">
                        <span v-for="(v,k) in item.stats" :key="k">{{k}}: {{v}} </span>
                     </div>
                </template>
             </div>
             <div v-if="inventoryList.length === 0" class="empty-tip">空空如也</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive, watch } from 'vue';
import {
  state, globalState, effectiveStats, slotCapacity,
  initGlobal, createSaveInSlot, loadSlot, deleteSlot, exitToMenu,
  meditate, allocateQi, startCombat, skipCombat,
  drawKungFu, equipKungFu, unequipKungFu,
  upgradeBuilding, drawEquipment, equipItem, unequipItem
} from './gameLogic';
import { KUNGFU_DEFINITIONS } from './data/kungfu';
import { ITEM_DEFINITIONS } from './data/items';

// State
const drawerOpen = ref(false);
const drawerTab = ref('action'); // action, stats, estate, kungfu, qi
const logsContainer = ref(null);
const selectedReport = ref(null);

const inventoryModal = reactive({
  show: false,
  type: null
});

// Computed
const playerHpPct = computed(() => {
  return Math.max(0, (1 - state.combatState.playerMarks / 12) * 100);
});
const enemyHpPct = computed(() => {
  return Math.max(0, (1 - state.combatState.enemyMarks / 12) * 100);
});

const inventoryList = computed(() => {
  if (!inventoryModal.type) return [];
  const type = inventoryModal.type;
  if (type === 'weapon' || type === 'armor') {
    return state.player.bag
      .map(id => ITEM_DEFINITIONS[id])
      .filter(def => def && def.type === type);
  } else {
    const uniqueIds = [...new Set(state.player.inventory)];
    return uniqueIds
      .map(id => KUNGFU_DEFINITIONS[id])
      .filter(def => def && def.type === type);
  }
});

// Watch logs to scroll
watch(() => state.logs.length, () => {
  if (logsContainer.value) {
    setTimeout(() => {
      logsContainer.value.scrollTop = 0; // Newest is at top (flex-col reverse?) No, typically logs push down.
      // Wait, standard MUD: newest at bottom.
      // My gameLogic unshifts (puts new at index 0).
      // So in v-for, index 0 is at top.
      // If I want newest at bottom, I should reverse the array or use flex-direction: column-reverse.
      // Let's stick to "Newest at Top" for mobile reading convenience?
      // Actually standard MUDs append to bottom.
      // If gameLogic unshifts, then state.logs[0] is newest.
      // So rendered list: Log[0] (New), Log[1] (Old).
      // If I want reading flow, newest should be at top? No, usually you read down.
      // Let's keep it simple: Newest at top of the list is fine for "Feed" style.
    }, 50);
  }
});

// Actions
function handleBackToMenu() { exitToMenu(); }
function handleCreate(idx) { createSaveInSlot(idx); }
function handleLoad(idx) { loadSlot(idx); }
function handleDelete(idx) { if(confirm("删除存档？")) deleteSlot(idx); }

function handleFight() { startCombat(); drawerOpen.value = false; } // Auto close on fight
function handleSkip() { skipCombat(); }
function handleMeditate() { meditate(); }
function handleGachaKungFu() { drawKungFu(); }
function handleAlloc(t, v) { allocateQi(t, v); }
function handleUpgrade(type) { upgradeBuilding(type); }
function handleDrawEquip() { drawEquipment(); }

function openReportById(id) {
  const r = state.battleReports.find(x => x.id === id);
  if (r) selectedReport.value = r;
}

function openInventory(type) {
  if (state.combatState.inCombat) return;
  inventoryModal.type = type;
  inventoryModal.show = true;
}
function closeInventory() { inventoryModal.show = false; inventoryModal.type = null; }
function selectItem(id) {
  if (inventoryModal.type === 'weapon' || inventoryModal.type === 'armor') {
    equipItem(id);
  } else {
    equipKungFu(id);
  }
  closeInventory();
}
function handleUnequip(t, i) { if(!state.combatState.inCombat) unequipKungFu(t, i); }
function handleUnequipItem(slot) { if(!state.combatState.inCombat) unequipItem(slot); }

function getKfName(id) { return KUNGFU_DEFINITIONS[id]?.name || id; }
function getEquippedName(type) {
  const id = state.player.equipment[type];
  return id ? getKfName(id) : '';
}
function getItemName(id) { return ITEM_DEFINITIONS[id]?.name || id; }
function getEquippedItemName(slot) {
  const id = state.player.gear[slot];
  return id ? getItemName(id) : '';
}

onMounted(() => { initGlobal(); });
</script>

<style>
/* Reset & Base */
:root {
  --bg-color: #1a1a1a;
  --text-color: #d4d4d4;
  --accent-color: #00bcd4;
  --dim-color: #888;
  --border-color: #333;
  --red-color: #ef5350;
  --hp-green: #4caf50;
  --hp-red: #f44336;
  --font-stack: "PingFang SC", "Microsoft YaHei", sans-serif;
}

body {
  margin: 0;
  background-color: #000;
  font-family: var(--font-stack);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
}

/* Container */
.app-container {
  background-color: var(--bg-color);
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* Button Reset */
button {
  border: none;
  background: none;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
}
button:disabled { opacity: 0.5; cursor: not-allowed; }

/* === STATUS BAR === */
.status-bar {
  flex: 0 0 auto;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(255,255,255,0.02);
  height: 50px; /* Approx for 2 lines */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.status-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 1.4;
  font-size: 14px;
}
.stats-mini { font-size: 12px; color: var(--dim-color); }
.name { font-weight: bold; color: #fff; margin-right: 8px; }
.badge { font-size: 10px; background: #333; padding: 1px 4px; border-radius: 2px; color: var(--accent-color); }
.hp-bar-container { flex: 1; height: 8px; background: #333; margin: 0 8px; border-radius: 4px; overflow: hidden; max-width: 100px; }
.hp-bar { height: 100%; transition: width 0.3s; }
.hp-bar.player { background: var(--hp-green); }
.hp-bar.enemy { background: var(--hp-red); }
.skip-btn-mini { border: 1px solid var(--red-color); color: var(--red-color); font-size: 10px; padding: 0 4px; border-radius: 4px; }

/* === LOG AREA === */
.log-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 60px; /* Ensure bottom logs are visible above drawer handle */
  min-height: 0;
  display: flex;
  flex-direction: column; /* Newest at top? default is top-down. unshift puts at top. */
  gap: 8px;
  -webkit-overflow-scrolling: touch;
}
.log-entry { font-size: 14px; line-height: 1.5; color: #bbb; animation: fadeIn 0.3s ease; }
.log-entry.combat { color: #e57373; }
.log-entry.growth { color: #81c784; }
.log-entry.system { color: #90caf9; }
.time { color: #555; font-size: 12px; margin-right: 6px; }
.link-text { color: var(--accent-color); text-decoration: underline; cursor: pointer; margin-left: 6px; font-size: 12px; }
.empty-log { text-align: center; color: #444; margin-top: 40px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

/* === DRAWER === */
.drawer-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #222;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: max-height 0.3s ease;
  z-index: 10;
}
.drawer-handle {
  padding: 10px;
  text-align: center;
  background: #2a2a2a;
  cursor: pointer;
  border-bottom: 1px solid #333;
}
.handle-text { font-size: 12px; color: var(--accent-color); font-weight: bold; letter-spacing: 1px; }

.drawer-content {
  display: none; /* Hidden by default */
  flex-direction: column;
  height: 40vh; /* Fixed height when open */
}
.drawer-container.open .drawer-content { display: flex; }

.drawer-tabs { display: flex; border-bottom: 1px solid #333; }
.drawer-tabs button {
  flex: 1; padding: 12px 0;
  text-align: center; font-size: 14px;
  color: #777;
  border-bottom: 2px solid transparent;
}
.drawer-tabs button.active { color: var(--accent-color); border-bottom-color: var(--accent-color); }
.drawer-tabs .menu-btn { color: var(--red-color); }

.tab-pane { flex: 1; padding: 16px; overflow-y: auto; }

/* Action Pane */
.action-pane { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.action-btn {
  border: 1px solid #444; padding: 16px; border-radius: 4px;
  background: rgba(255,255,255,0.05); display: flex; flex-direction: column; align-items: center;
}
.action-btn:active { background: rgba(255,255,255,0.1); }
.btn-l { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
.btn-s { font-size: 10px; color: #888; }
.hint-text { grid-column: 1 / -1; text-align: center; color: #666; font-size: 12px; margin-top: 8px; }

/* Stats Pane */
.stats-pane { display: flex; flex-direction: column; gap: 16px; }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stat-cell { display: flex; justify-content: space-between; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; }
.stat-cell .label { color: #888; font-size: 12px; }
.stat-cell .val { font-weight: bold; font-size: 14px; }
.stat-row { font-size: 12px; color: #888; display: flex; flex-direction: column; gap: 4px; }
input[type=range] { width: 100%; }

/* KungFu Pane */
.kungfu-pane { display: flex; flex-direction: column; gap: 12px; }
.kf-header { font-size: 12px; color: #888; margin-bottom: 4px; }
.kf-slot { padding: 12px; border: 1px dashed #444; text-align: center; border-radius: 4px; font-size: 14px; cursor: pointer; }
.kf-list { display: flex; gap: 8px; flex-wrap: wrap; }
.kf-chip {
  padding: 6px 10px; background: #333; font-size: 12px; border-radius: 12px; cursor: pointer;
  display: flex; align-items: center;
}
.kf-chip.add { background: transparent; border: 1px dashed #666; }

/* Qi Pane */
.qi-pane { display: flex; flex-direction: column; gap: 16px; padding-top: 24px; }
.qi-row { display: flex; justify-content: space-between; align-items: center; }
.qi-ctrl { display: flex; align-items: center; gap: 12px; }
.qi-ctrl button { width: 30px; height: 30px; background: #333; border-radius: 50%; font-weight: bold; font-size: 18px; line-height: 1; }
.qi-val { font-size: 18px; font-weight: bold; width: 30px; text-align: center; }
.qi-remain { text-align: center; color: var(--accent-color); font-size: 12px; margin-top: 12px; }

/* Estate Pane */
.estate-pane { display: flex; flex-direction: column; gap: 16px; }
.res-bar { display: flex; justify-content: space-around; background: #333; padding: 8px; border-radius: 4px; }
.res-item { font-weight: bold; font-size: 14px; color: var(--accent-color); }
.estate-row { display: flex; flex-direction: column; gap: 12px; }
.building-card { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 4px; border: 1px solid #444; }
.b-title { font-weight: bold; font-size: 14px; color: #eee; }
.b-desc { font-size: 12px; color: #888; margin: 4px 0 8px; }
.up-btn, .draw-btn {
    display: inline-block; padding: 6px 12px; margin-right: 8px; font-size: 12px;
    border: 1px solid #555; border-radius: 4px; background: #333;
}
.up-btn:active, .draw-btn:active { background: #444; }

/* Gear Section */
.gear-section { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.gear-slot { background: #333; padding: 12px; border-radius: 4px; display: flex; flex-direction: column; position: relative; cursor: pointer; }
.slot-label { font-size: 10px; color: #888; }
.slot-val { font-size: 14px; font-weight: bold; margin-top: 4px; }
.x-btn { position: absolute; top: 4px; right: 8px; font-size: 14px; color: #888; }

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal {
  width: 90%; max-width: 400px; max-height: 70vh;
  background: #222; border: 1px solid #444;
  display: flex; flex-direction: column;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.modal-header { padding: 12px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { font-size: 20px; color: #888; padding: 4px; }
.modal-body { flex: 1; overflow-y: auto; padding: 16px; }
.list-item { padding: 12px; border-bottom: 1px solid #333; cursor: pointer; }
.list-item:last-child { border-bottom: none; }
.item-title { font-weight: bold; font-size: 14px; color: #ddd; }
.item-desc { font-size: 12px; color: #888; margin-top: 2px; }
.item-meta { font-size: 10px; color: var(--accent-color); margin-top: 4px; }
.modal-footer { padding: 12px; border-top: 1px solid #333; text-align: center; font-size: 14px; font-weight: bold; }
.win { color: var(--hp-green); }
.loss { color: var(--hp-red); }

/* Menu View */
.menu-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 24px; padding: 24px; }
.menu-title { font-size: 28px; letter-spacing: 4px; font-weight: lighter; color: #eee; text-shadow: 0 0 10px rgba(0,0,0,0.5); }
.slot-list { width: 100%; max-width: 300px; display: flex; flex-direction: column; gap: 16px; }
.slot-item { position: relative; }
.slot-content {
  border: 1px solid #444; padding: 20px; text-align: center; cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.02);
}
.slot-content:active { background: rgba(255,255,255,0.05); }
.slot-content.filled { border-color: var(--accent-color); }
.slot-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
.slot-info { font-size: 10px; color: #777; }
.delete-btn { position: absolute; right: -30px; top: 50%; transform: translateY(-50%); color: #666; font-size: 20px; }
</style>
