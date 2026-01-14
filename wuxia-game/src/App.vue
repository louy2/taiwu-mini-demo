<template>
  <div class="container">
    <div class="header">
      <h1 class="title">放置随机武侠</h1>
      <div class="player-card">
        <h2 class="name">{{ state.player.name }}</h2>

        <!-- Qi Section -->
        <div class="qi-section">
          <div class="qi-header">
            <span>真气: {{ state.player.qi }}/280</span>
            <span class="qi-sub">(已用: {{ state.player.qiDestruction + state.player.qiProtection }})</span>
          </div>

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
        </div>

        <div class="stats">
          <div class="stat-item">
            <span class="label">力道</span>
            <span class="value">{{ effectiveStats.power }}</span>
          </div>
          <div class="stat-item">
            <span class="label">卸力</span>
            <span class="value">{{ effectiveStats.parry }}</span>
          </div>
          <div class="stat-item">
            <span class="label">破体</span>
            <span class="value">{{ effectiveStats.penetration }}</span>
          </div>
          <div class="stat-item">
            <span class="label">御体</span>
            <span class="value">{{ effectiveStats.resistance }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button
        @click="handleMeditate"
        :disabled="state.combatState.inCombat"
        class="btn train-btn"
      >
        <span class="btn-text">运转周天</span>
        <span class="btn-sub">提升真气</span>
      </button>

      <button
        @click="handleFight"
        :disabled="state.combatState.inCombat"
        class="btn fight-btn"
      >
        <span class="btn-text">战斗</span>
        <span class="btn-sub">寻找对手</span>
      </button>

      <button
        v-if="state.battleReports.length > 0"
        @click="showReportList = true"
        class="btn report-btn"
      >
        <span class="btn-text">战报</span>
        <span class="btn-sub">回顾往昔</span>
      </button>
    </div>

    <div v-if="state.combatState.inCombat" class="combat-status">
      <div class="status-row">
        <span>你 ({{ state.combatState.playerMarks }}/12)</span>
        <span class="vs">VS</span>
        <span>{{ state.combatState.enemy.name }} ({{ state.combatState.enemyMarks }}/12)</span>
      </div>

      <!-- Mark Progress Bars (Health) -->
      <div class="bars">
        <div class="hp-bar player-hp" :style="{ width: (1 - state.combatState.playerMarks/12)*100 + '%' }"></div>
        <div class="hp-bar enemy-hp" :style="{ width: (1 - state.combatState.enemyMarks/12)*100 + '%' }"></div>
      </div>

      <!-- Damage Pool Progress (Sub-bars) -->
      <div class="pool-row">
        <span class="pool-label">伤势积压: {{ state.combatState.playerDamagePool.toFixed(0) }}/200</span>
        <span class="pool-label">伤势积压: {{ state.combatState.enemyDamagePool.toFixed(0) }}/200</span>
      </div>

      <!-- Skip Button -->
      <button class="skip-btn" @click="handleSkip" v-if="!state.combatState.skipping">
        >> 直接结束
      </button>
      <div v-else class="skip-text">快速结算中...</div>
    </div>

    <div class="logs-container">
      <div class="logs-header">江湖阅历</div>
      <div class="logs-list" ref="logsContainer">
        <div
          v-for="log in state.logs"
          :key="log.id"
          class="log-item"
          :class="log.type"
        >
          <span class="time">[{{ log.timestamp }}]</span>
          <span class="text">{{ log.text }}</span>
        </div>
      </div>
    </div>

    <!-- Battle Report List Modal -->
    <div v-if="showReportList" class="modal-overlay" @click.self="showReportList = false">
      <div class="modal">
        <div class="modal-header">
          <h3>近期战报</h3>
          <button class="close-btn" @click="showReportList = false">X</button>
        </div>
        <div class="report-list">
          <div
            v-for="report in state.battleReports"
            :key="report.id"
            class="report-item"
            @click="openReport(report)"
          >
            <span class="report-time">{{ report.timestamp }}</span>
            <span class="report-enemy">VS {{ report.enemyName }}</span>
            <span class="report-result" :class="{ win: report.result === '胜利', loss: report.result !== '胜利' }">
              {{ report.result }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Battle Detail Modal -->
    <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
      <div class="modal detail-modal">
        <div class="modal-header">
          <h3>战报详情 - {{ selectedReport.result }}</h3>
          <button class="close-btn" @click="selectedReport = null">X</button>
        </div>
        <div class="detail-logs">
          <div v-for="(log, idx) in selectedReport.logs" :key="idx" class="log-item combat">
            <span class="time">[{{ log.timestamp }}]</span>
            <span class="text">{{ log.text }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { state, effectiveStats, initGame, meditate, allocateQi, startCombat, skipCombat } from './gameLogic';

const logsContainer = ref(null);
const showReportList = ref(false);
const selectedReport = ref(null);

onMounted(() => {
  initGame();
});

function handleMeditate() {
  meditate();
}

function handleAlloc(type, amt) {
  allocateQi(type, amt);
}

function handleFight() {
  startCombat();
}

function handleSkip() {
  skipCombat();
}

function openReport(report) {
  selectedReport.value = report;
}
</script>

<style>
/* Reset & Base */
:root {
  --bg-color: #f4e4bc; /* Parchment */
  --text-color: #3e2723;
  --border-color: #5d4037;
  --accent-color: #8d6e63;
  --red-color: #b71c1c;
}

body {
  margin: 0;
  font-family: "Songti SC", "SimSun", serif; /* Wuxia font style */
  background-color: #2c2c2c;
  color: var(--text-color);
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

#app {
  width: 100%;
  max-width: 480px; /* Mobile width */
  background-color: var(--bg-color);
  min-height: 100vh;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  border: 4px double var(--border-color);
  position: relative;
}

/* Header */
.header {
  text-align: center;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  margin: 0 0 12px 0;
  font-weight: bold;
  letter-spacing: 4px;
}

.player-card {
  border: 1px solid var(--border-color);
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
}

.name {
  margin: 0 0 8px 0;
  font-size: 20px;
}

/* Qi Section */
.qi-section {
  margin: 8px 0;
  padding: 8px;
  border: 1px dashed var(--accent-color);
  background: rgba(255, 255, 255, 0.2);
}

.qi-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}
.qi-sub {
  font-size: 12px;
  opacity: 0.8;
}

.qi-controls {
  display: flex;
  justify-content: space-around;
}

.qi-control-row {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qi-label {
  font-size: 12px;
  margin-bottom: 4px;
}

.qi-btns button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-color);
  background: #fff;
  cursor: pointer;
  margin: 0 2px;
}
.qi-btns button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 12px;
  opacity: 0.8;
}

.value {
  font-size: 18px;
  font-weight: bold;
}

/* Actions */
.actions {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.btn {
  flex: 1;
  padding: 16px;
  border: 2px solid var(--border-color);
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s;
  justify-content: center;
}

.btn:active:not(:disabled) {
  background: rgba(0,0,0,0.05);
  transform: translateY(2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-text {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
}

.btn-sub {
  font-size: 10px;
  opacity: 0.7;
  white-space: nowrap;
}

.train-btn { border-color: var(--accent-color); }
.fight-btn { border-color: var(--red-color); color: var(--red-color); }
.report-btn { border-color: #555; color: #555; }

/* Combat Status */
.combat-status {
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(183, 28, 28, 0.1);
  border: 1px dashed var(--red-color);
  display: flex;
  flex-direction: column;
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: bold;
}

.pool-row {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  opacity: 0.8;
}

.bars {
  display: flex;
  justify-content: space-between;
  height: 6px;
  background: #ddd;
  margin-top: 4px;
}

.hp-bar {
  height: 100%;
  transition: width 0.3s;
}
.player-hp { background: #4caf50; }
.enemy-hp { background: #f44336; margin-left: auto; }

.skip-btn {
  margin-top: 8px;
  background: var(--red-color);
  color: white;
  border: none;
  padding: 8px;
  font-family: inherit;
  cursor: pointer;
  font-weight: bold;
  align-self: center;
  width: 100%;
}
.skip-text {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  opacity: 0.8;
}

/* Logs */
.logs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--border-color);
  overflow: hidden; /* For scrolling inside */
}

.logs-header {
  padding: 8px 0;
  text-align: center;
  font-weight: bold;
  background: rgba(0,0,0,0.05);
}

.logs-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.log-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dotted rgba(93, 64, 55, 0.3);
  font-size: 14px;
  line-height: 1.4;
}

.time {
  opacity: 0.6;
  font-size: 12px;
  margin-right: 8px;
}

.log-item.combat {
  color: var(--red-color);
}
.log-item.growth {
  color: #2e7d32;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--bg-color);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  border: 4px double var(--border-color);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}
.modal-header h3 { margin: 0; }

.close-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  width: 30px; height: 30px;
  cursor: pointer;
}

.report-list, .detail-logs {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px dotted var(--border-color);
  cursor: pointer;
}
.report-item:active { background: rgba(0,0,0,0.05); }

.report-time { font-size: 12px; opacity: 0.6; }
.report-enemy { font-weight: bold; }
.report-result { font-weight: bold; }
.report-result.win { color: green; }
.report-result.loss { color: red; }

.detail-modal {
  width: 95%;
  max-width: 460px;
  height: 80vh;
}
</style>
