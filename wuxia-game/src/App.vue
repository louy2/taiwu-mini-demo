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

      <CombatView v-if="isCombatMode" />

      <div v-else class="std-interface">

        <!-- Split Screen Layout -->
        <div class="split-layout">
          <!-- Left Panel: Tab Content -->
          <div class="left-panel">
            <main class="tab-content">
              <TabWorld
                v-if="currentTab === 'world'"
                @open-report="openReportById"
              />
              <TabCharacter
                v-if="currentTab === 'character'"
                @open-inventory="openInventory"
              />
              <TabEstate
                v-if="currentTab === 'estate'"
              />
            </main>
          </div>

          <!-- Right Panel: Global Logs -->
          <aside class="right-panel">
            <div class="logs-header">
              <span>江湖事迹</span>
            </div>
            <GlobalLogs @open-report="openReportById" />
          </aside>
        </div>

        <!-- Bottom Navigation -->
        <BottomNav v-model:currentTab="currentTab" />

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
                <div class="item-title">
                  {{ item.name }}
                  <span v-if="state.player.itemCounts && state.player.itemCounts[item.id] > 0" style="color: #ff9800; font-size: 12px; margin-left: 4px;">
                     +{{ state.player.itemCounts[item.id] }}
                  </span>
                </div>

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
import CombatView from './components/CombatView.vue';
import TabWorld from './components/TabWorld.vue';
import TabCharacter from './components/TabCharacter.vue';
import TabEstate from './components/TabEstate.vue';
import BottomNav from './components/BottomNav.vue';
import GlobalLogs from './components/GlobalLogs.vue';

import {
  state, globalState,
  initGlobal, createSaveInSlot, loadSlot, deleteSlot, exitToMenu,
  equipKungFu, equipItem
} from './gameLogic';
import { KUNGFU_DEFINITIONS } from './data/kungfu';
import { ITEM_DEFINITIONS } from './data/items';

// State
const currentTab = ref('world');
const selectedReport = ref(null);

const inventoryModal = reactive({
  show: false,
  type: null
});

// Computed
const isCombatMode = computed(() => state.combatState.phase !== 'idle');

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

// Actions
function handleCreate(idx) { createSaveInSlot(idx); }
function handleLoad(idx) { loadSlot(idx); }
function handleDelete(idx) { if(confirm("删除存档？")) deleteSlot(idx); }

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
  overscroll-behavior: none;
}

/* Container */
.app-container {
  background-color: var(--bg-color);
  width: 100vw;
  max-width: 480px; /* Mobile default */
  margin: 0 auto;
  height: 100vh; /* Fallback */
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

/* Responsive: Tablet and Desktop */
@media (min-width: 768px) {
  .app-container {
    max-width: 960px;
  }
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

/* === GAME VIEW & LAYOUT === */
.game-view {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.std-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  overflow: hidden; /* Each tab manages its own scroll */
  position: relative;
}

/* === MODALS === */
.modal-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
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

/* === SPLIT LAYOUT === */
.split-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #333;
  background: rgba(0,0,0,0.1);
  min-height: 0;
  overflow: hidden; /* Contain scroll within */
}

.logs-header {
  flex: 0 0 auto;
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid #333;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 2px;
  color: #888;
}

/* Responsive: Side-by-side on larger displays */
@media (min-width: 768px) {
  .split-layout {
    flex-direction: row;
  }

  .left-panel {
    flex: 0 0 50%;
    max-width: 480px;
    border-right: 1px solid #333;
  }

  .right-panel {
    border-top: none;
    border-left: 1px solid #333;
  }
}

@media (min-width: 1024px) {
  .app-container {
    max-width: 1200px;
  }

  .left-panel {
    flex: 0 0 420px;
  }
}
</style>
