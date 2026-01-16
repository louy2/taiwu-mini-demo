<template>
  <div class="container">
    <div class="header">
      <h1 class="title">放置随机武侠</h1>
    </div>

    <!-- MAIN MENU VIEW -->
    <div v-if="globalState.activeSlotIndex === -1" class="menu-view">
      <div class="menu-title">角色选择</div>
      <div class="slot-list">
        <div
          v-for="(slot, idx) in globalState.slots"
          :key="idx"
          class="slot-item"
        >
          <div v-if="slot" class="slot-content" @click="handleLoad(idx)">
            <div class="slot-name">{{ slot.player.name }}</div>
            <div class="slot-info">
              上次游玩: {{ new Date(slot.lastPlayed).toLocaleString() }}
            </div>
          </div>
          <div v-else class="slot-content empty" @click="handleCreate(idx)">
            <span class="empty-text">[ 空存档 - 点击创建 ]</span>
          </div>

          <button
            v-if="slot"
            class="delete-btn"
            @click.stop="handleDelete(idx)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- GAME VIEW -->
    <div v-else class="game-view">

      <button class="back-menu-btn" @click="handleBackToMenu">
        返回主页
      </button>

      <!-- Player Info & Stats -->
      <div class="player-card">
        <div class="card-header-row">
          <h2 class="name">{{ state.player.name }}</h2>
          <span class="neili-badge">
            {{ state.player.neiliType }} (内)
          </span>
        </div>

        <!-- Stats Grid (Compact) -->
        <div class="stats" @click="showFullStats = !showFullStats">
          <div class="stat-summary" v-if="!showFullStats">
            <span>力{{ effectiveStats.power }}/卸{{ effectiveStats.parry }}</span>
            <span>破体{{ effectiveStats.penetration }}/御体{{ effectiveStats.resistance }}</span>
            <span class="toggle-hint">▼</span>
          </div>
          <template v-else>
            <div class="stat-col">
              <div class="stat-item"><span class="label">力道</span><span class="value">{{ effectiveStats.power }}</span></div>
              <div class="stat-item"><span class="label">卸力</span><span class="value">{{ effectiveStats.parry }}</span></div>
            </div>
            <div class="stat-col">
              <div class="stat-item"><span class="label">破体</span><span class="value">{{ effectiveStats.penetration }}</span></div>
              <div class="stat-item"><span class="label">御体</span><span class="value">{{ effectiveStats.resistance }}</span></div>
            </div>
            <div class="stat-col">
              <div class="stat-item"><span class="label">破气</span><span class="value">{{ effectiveStats.qiBreach }}</span></div>
              <div class="stat-item"><span class="label">御气</span><span class="value">{{ effectiveStats.qiGuard }}</span></div>
            </div>
          </template>
        </div>

        <!-- Resources -->
        <div class="resource-row">
           <span>真气: {{ state.player.qi }}/280 (已用:{{state.player.qiDestruction+state.player.qiProtection}})</span>
        </div>

        <!-- Controls: Toggle between Qi/Ratio and KungFu -->
        <div class="tab-controls">
          <button @click="uiTab = 'qi'" :class="{ active: uiTab === 'qi' }">调息</button>
          <button @click="uiTab = 'kungfu'" :class="{ active: uiTab === 'kungfu' }">功法</button>
        </div>

        <!-- Tab: Qi & Ratio -->
        <div v-if="uiTab === 'qi'" class="tab-content">
          <div class="qi-controls">
            <div class="qi-control-row">
              <span class="qi-label">摧破 ({{ state.player.qiDestruction }})</span>
              <div class="qi-btns">
                <button @click="handleAlloc('destruction', -1)" :disabled="state.player.qiDestruction <= 0">-</button>
                <button @click="handleAlloc('destruction', 1)" :disabled="state.player.qiDestruction + state.player.qiProtection >= state.player.qi">+</button>
              </div>
            </div>
            <div class="qi-control-row">
              <span class="qi-label">护体 ({{ state.player.qiProtection }})</span>
              <div class="qi-btns">
                <button @click="handleAlloc('protection', -1)" :disabled="state.player.qiProtection <= 0">-</button>
                <button @click="handleAlloc('protection', 1)" :disabled="state.player.qiDestruction + state.player.qiProtection >= state.player.qi">+</button>
              </div>
            </div>
          </div>

          <div class="ratio-control">
            <div class="ratio-label">
              <span>外伤 {{ 100 - state.player.internalRatio }}%</span>
              <span>内伤 {{ state.player.internalRatio }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              v-model.number="state.player.internalRatio"
              class="slider"
              :disabled="state.combatState.inCombat"
            >
          </div>
        </div>

        <!-- Tab: KungFu -->
        <div v-if="uiTab === 'kungfu'" class="tab-content">
          <div class="equip-section">
            <div class="equip-label">内功</div>
            <div class="equip-slot" @click="openInventory('internal')">
              {{ getEquippedName('internal') || '[空] 点击装备' }}
            </div>
          </div>

          <div class="equip-section">
            <div class="equip-label">催破 ({{state.player.equipment.destruction.length}}/{{slotCapacity.destruction}})</div>
            <div class="equip-slot-list">
              <div
                v-for="(id, idx) in state.player.equipment.destruction"
                :key="'dest'+idx"
                class="equip-slot small"
                @click="handleUnequip('destruction', idx)"
              >
                {{ getKfName(id) }} (X)
              </div>
              <div
                v-if="state.player.equipment.destruction.length < slotCapacity.destruction"
                class="equip-slot small add"
                @click="openInventory('destruction')"
              >
                +
              </div>
            </div>
          </div>

          <div class="equip-section">
            <div class="equip-label">护体 ({{state.player.equipment.protection.length}}/{{slotCapacity.protection}})</div>
            <div class="equip-slot-list">
              <div
                v-for="(id, idx) in state.player.equipment.protection"
                :key="'prot'+idx"
                class="equip-slot small"
                @click="handleUnequip('protection', idx)"
              >
                {{ getKfName(id) }} (X)
              </div>
              <div
                v-if="state.player.equipment.protection.length < slotCapacity.protection"
                class="equip-slot small add"
                @click="openInventory('protection')"
              >
                +
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="actions">
        <button @click="handleMeditate" :disabled="state.combatState.inCombat" class="btn train-btn">
          <span class="btn-text">运转周天</span>
          <span class="btn-sub">提升真气</span>
        </button>
        <button @click="handleFight" :disabled="state.combatState.inCombat" class="btn fight-btn">
          <span class="btn-text">战斗</span>
          <span class="btn-sub">寻找对手</span>
        </button>
        <button @click="handleGacha" :disabled="state.combatState.inCombat" class="btn gacha-btn">
          <span class="btn-text">研读经书</span>
          <span class="btn-sub">领悟功法</span>
        </button>
        <button v-if="state.battleReports.length > 0" @click="showReportList = true" class="btn report-btn">
          <span class="btn-text">战报</span>
          <span class="btn-sub">回顾</span>
        </button>
      </div>

      <div v-if="state.combatState.inCombat" class="combat-status">
        <div class="status-row">
          <span>你 ({{ state.combatState.playerMarks }}/12)</span>
          <span class="vs">VS</span>
          <span>{{ state.combatState.enemy.name }} ({{ state.combatState.enemyMarks }}/12)</span>
        </div>
        <div class="bars">
          <div class="hp-bar player-hp" :style="{ width: (1 - state.combatState.playerMarks/12)*100 + '%' }"></div>
          <div class="hp-bar enemy-hp" :style="{ width: (1 - state.combatState.enemyMarks/12)*100 + '%' }"></div>
        </div>

        <!-- Resource Bars (Shi/TiQi) -->
        <div class="res-bars">
           <div class="res-bar-container">
             <div class="res-bar shi-bar" :style="{ width: Math.min(100, state.player.resources.shi * 10) + '%' }"></div>
             <span class="res-text">势: {{ state.player.resources.shi }}</span>
           </div>
           <div class="res-bar-container">
             <div class="res-bar tiqi-bar" :style="{ width: Math.min(100, (state.player.resources.tiqi / 30000) * 100) + '%' }"></div>
             <span class="res-text">提气: {{ Math.floor(state.player.resources.tiqi) }}</span>
           </div>
        </div>

        <div class="live-combat-log" ref="liveLogContainer">
          <div v-for="(log, idx) in state.combatState.currentBattleLogs.slice(-3)" :key="idx" class="live-log-item">
            {{ log.text }}
          </div>
        </div>

        <button class="skip-btn" @click="handleSkip" v-if="!state.combatState.skipping">>> 直接结束</button>
        <div v-else class="skip-text">快速结算中...</div>
      </div>

      <div class="logs-container">
        <div class="logs-header">江湖阅历</div>
        <div class="logs-list" ref="logsContainer">
          <div v-for="log in state.logs" :key="log.id" class="log-item" :class="log.type">
            <span class="time">[{{ log.timestamp }}]</span>
            <span class="text">{{ log.text }}</span>
          </div>
        </div>
      </div>

      <!-- Battle Report Modals -->
      <div v-if="showReportList" class="modal-overlay" @click.self="showReportList = false">
        <div class="modal">
          <div class="modal-header"><h3>近期战报</h3><button class="close-btn" @click="showReportList = false">X</button></div>
          <div class="report-list">
            <div v-for="report in state.battleReports" :key="report.id" class="report-item" @click="openReport(report)">
              <span class="report-time">{{ report.timestamp }}</span>
              <span class="report-result" :class="{ win: report.result === '胜利', loss: report.result !== '胜利' }">{{ report.result }} ({{report.enemyName}})</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
        <div class="modal detail-modal">
          <div class="modal-header"><h3>战报详情</h3><button class="close-btn" @click="selectedReport = null">X</button></div>
          <div class="detail-logs">
            <div v-for="(log, idx) in selectedReport.logs" :key="idx" class="log-item combat">{{ log.text }}</div>
          </div>
        </div>
      </div>

      <!-- Inventory Selection Modal -->
      <div v-if="inventoryModal.show" class="modal-overlay" @click.self="closeInventory">
        <div class="modal">
          <div class="modal-header"><h3>选择{{ inventoryModal.type === 'internal' ? '内功' : inventoryModal.type === 'destruction' ? '催破' : '护体' }}</h3><button class="close-btn" @click="closeInventory">X</button></div>
          <div class="report-list">
            <div v-for="kf in inventoryList" :key="kf.id" class="report-item" @click="selectKungFu(kf.id)">
              <div style="display:flex; flex-direction:column; width:100%;">
                <span style="font-weight:bold;">{{ kf.name }}</span>
                <span style="font-size:10px; opacity:0.8;">{{ kf.desc }}</span>
                <span style="font-size:10px; color:brown;" v-if="kf.type === 'internal'">{{ kf.neiliType }} | 催{{kf.slots.destruction}} 护{{kf.slots.protection}}</span>
                <span style="font-size:10px; color:brown;" v-if="kf.type === 'destruction'">消耗势: {{kf.costShi}}</span>
                <span style="font-size:10px; color:brown;" v-if="kf.type === 'protection'">消耗提气: {{kf.costTiQi}}</span>
              </div>
            </div>
            <div v-if="inventoryList.length === 0" style="padding:16px; text-align:center; opacity:0.6;">暂无此类功法</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, reactive } from 'vue';
import {
  state, globalState, effectiveStats, slotCapacity,
  initGlobal, createSaveInSlot, loadSlot, deleteSlot, exitToMenu,
  meditate, allocateQi, startCombat, skipCombat,
  drawKungFu, equipKungFu, unequipKungFu
} from './gameLogic';
import { KUNGFU_DEFINITIONS } from './data/kungfu';

const logsContainer = ref(null);
const showReportList = ref(false);
const selectedReport = ref(null);
const uiTab = ref('qi'); // 'qi' or 'kungfu'
const showFullStats = ref(false);

// Inventory Modal Logic
const inventoryModal = reactive({
  show: false,
  type: null // 'internal' | 'destruction' | 'protection'
});

const inventoryList = computed(() => {
  if (!inventoryModal.type) return [];
  // Filter player inventory by type
  const type = inventoryModal.type;
  // Unique IDs in inventory
  const uniqueIds = [...new Set(state.player.inventory)];
  return uniqueIds
    .map(id => KUNGFU_DEFINITIONS[id])
    .filter(def => def && def.type === type);
});

function openInventory(type) {
  if (state.combatState.inCombat) return;
  inventoryModal.type = type;
  inventoryModal.show = true;
}

function closeInventory() {
  inventoryModal.show = false;
  inventoryModal.type = null;
}

function selectKungFu(id) {
  equipKungFu(id);
  closeInventory();
}

function handleUnequip(type, idx) {
  if (state.combatState.inCombat) return;
  unequipKungFu(type, idx);
}

function getKfName(id) {
  return KUNGFU_DEFINITIONS[id] ? KUNGFU_DEFINITIONS[id].name : id;
}

function getEquippedName(type) {
  if (type === 'internal') {
    return state.player.equipment.internal ? getKfName(state.player.equipment.internal) : null;
  }
  return '';
}

// ... Actions ...
function handleGacha() { drawKungFu(); }
function handleMeditate() { meditate(); }
function handleAlloc(type, amt) { allocateQi(type, amt); }
function handleFight() { startCombat(); }
function handleSkip() { skipCombat(); }
function openReport(report) { selectedReport.value = report; }

// Menu
function handleCreate(idx) { createSaveInSlot(idx); }
function handleLoad(idx) { loadSlot(idx); }
function handleDelete(idx) { if (confirm("确定要删除这个存档吗？")) deleteSlot(idx); }
function handleBackToMenu() { exitToMenu(); }

onMounted(() => { initGlobal(); });
</script>

<style>
/* Reset & Base */
:root {
  --bg-color: #1a1a1a;
  --text-color: #d4d4d4;
  --border-color: #444;
  --accent-color: #00bcd4;
  --red-color: #ef5350;
}

body {
  margin: 0;
  font-family: "Songti SC", "SimSun", "Microsoft YaHei", sans-serif;
  background-color: #2c2c2c;
  color: var(--text-color);
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

#app {
  width: 100%;
  max-width: 480px;
  background-color: var(--bg-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
  border: 4px double var(--border-color);
  position: relative;
}

/* Common Styles */
.header { text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px; }
.title { font-size: 24px; margin: 0; font-weight: bold; }
.player-card { border: 1px solid var(--border-color); padding: 12px; background: rgba(255, 255, 255, 0.3); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.name { margin: 0; font-size: 20px; }
.neili-badge { font-size: 12px; font-weight: bold; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #aaa; }

/* Tabs */
.tab-controls { display: flex; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); }
.tab-controls button { flex: 1; border: none; background: transparent; padding: 8px; cursor: pointer; font-weight: bold; opacity: 0.6; }
.tab-controls button.active { opacity: 1; border-bottom: 2px solid var(--red-color); }
.tab-content { min-height: 120px; }

/* KungFu UI */
.equip-section { margin-bottom: 8px; }
.equip-label { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
.equip-slot { border: 1px solid var(--border-color); padding: 8px; background: rgba(255,255,255,0.4); cursor: pointer; font-size: 14px; text-align: center;}
.equip-slot-list { display: flex; gap: 4px; flex-wrap: wrap; }
.equip-slot.small { flex: 1; font-size: 12px; padding: 6px; min-width: 80px; }
.equip-slot.add { flex: 0 0 30px; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.05); }

/* Resources */
.resource-row { font-size: 12px; margin-top: 8px; font-weight: bold; }
.res-bars { display: flex; gap: 8px; margin-top: 8px; }
.res-bar-container { flex: 1; height: 14px; background: #ddd; position: relative; border: 1px solid #999; }
.res-bar { height: 100%; transition: width 0.3s; }
.shi-bar { background: #ff9800; }
.tiqi-bar { background: #2196f3; }
.res-text { position: absolute; width: 100%; text-align: center; font-size: 10px; line-height: 14px; top: 0; color: #000; text-shadow: 0 0 2px #fff; }

/* Existing Styles (Qi, Stats, Logs, etc.) */
.qi-section { margin: 8px 0; padding: 8px; border: 1px dashed var(--accent-color); background: rgba(255, 255, 255, 0.2); }
.qi-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
.qi-sub { font-size: 12px; opacity: 0.8; }
.qi-controls { display: flex; justify-content: space-around; margin-top: 4px; }
.qi-control-row { display: flex; flex-direction: column; align-items: center; }
.qi-btns button { width: 24px; height: 24px; border: 1px solid var(--border-color); background: #fff; cursor: pointer; margin: 0 2px; }
.stats { display: flex; justify-content: space-between; margin-top: 8px; cursor: pointer; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 4px; }
.stat-summary { display: flex; justify-content: space-between; width: 100%; font-size: 12px; font-family: monospace; }
.toggle-hint { opacity: 0.5; }
.stat-col { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.label { font-size: 10px; opacity: 0.8; }
.value { font-size: 14px; font-weight: bold; }
.actions { display: flex; gap: 8px; margin-bottom: 8px; flex-shrink: 0; flex-wrap: wrap; }
.btn { flex: 1; padding: 12px; border: 2px solid var(--border-color); background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 70px; }
.btn-text { font-size: 14px; font-weight: bold; }
.btn-sub { font-size: 10px; opacity: 0.7; }
.gacha-btn { border-color: #673ab7; color: #673ab7; }
.combat-status { margin-bottom: 8px; padding: 8px; background: rgba(183, 28, 28, 0.1); border: 1px dashed var(--red-color); flex-shrink: 0; }
.bars { display: flex; justify-content: space-between; height: 6px; background: #ddd; margin-top: 4px; }
.hp-bar { height: 100%; transition: width 0.3s; }
.player-hp { background: #4caf50; }
.enemy-hp { background: #f44336; margin-left: auto; }
.live-combat-log { margin-top: 4px; padding: 4px; background: rgba(0,0,0,0.05); height: 50px; overflow: hidden; font-size: 12px; display: flex; flex-direction: column; justify-content: flex-end; }
.live-log-item { color: var(--red-color); line-height: 1.3; }
.logs-container { flex: 1; display: flex; flex-direction: column; border-top: 2px solid var(--border-color); overflow: hidden; min-height: 0; }
.logs-list { flex: 1; overflow-y: auto; padding: 8px; }
.log-item { margin-bottom: 4px; font-size: 12px; border-bottom: 1px dotted #ccc; }
.menu-view { flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 20px; }
.slot-list { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.slot-item { display: flex; align-items: center; gap: 8px; }
.slot-content { flex: 1; border: 2px solid var(--border-color); padding: 16px; cursor: pointer; background: rgba(255,255,255,0.2); }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: var(--bg-color); width: 90%; max-width: 400px; max-height: 80vh; border: 4px double var(--border-color); display: flex; flex-direction: column; }
.modal-header { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border-color); }
.close-btn { background: transparent; border: 1px solid #000; cursor: pointer; }
.report-list { flex: 1; overflow-y: auto; padding: 12px; }
.report-item { border-bottom: 1px dotted #888; padding: 8px; cursor: pointer; }
.skip-btn { margin-top: 8px; width: 100%; background: var(--red-color); color: white; border: none; padding: 8px; cursor: pointer; }
</style>
