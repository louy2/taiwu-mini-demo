<template>
  <div class="container">
    <div class="header">
      <h1 class="title">放置随机武侠</h1>
      <div class="player-card">
        <h2 class="name">{{ state.player.name }}</h2>
        <div class="stats">
          <div class="stat-item">
            <span class="label">力道</span>
            <span class="value">{{ state.player.power }}</span>
          </div>
          <div class="stat-item">
            <span class="label">卸力</span>
            <span class="value">{{ state.player.parry }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button
        @click="handleTrain"
        :disabled="state.combatState.inCombat"
        class="btn train-btn"
      >
        <span class="btn-text">成长</span>
        <span class="btn-sub">精进武艺</span>
      </button>

      <button
        @click="handleFight"
        :disabled="state.combatState.inCombat"
        class="btn fight-btn"
      >
        <span class="btn-text">战斗</span>
        <span class="btn-sub">寻找对手</span>
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
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from 'vue';
import { state, initGame, train, startCombat } from './gameLogic';

const logsContainer = ref(null);

onMounted(() => {
  initGame();
});

// Auto-scroll logs logic (optional, but good for UX)
// But since logs are newest-first (unshift), we might want to stay at top?
// The logic `state.logs.unshift` puts new logs at the top.
// So no need to scroll to bottom. Top is fine.

function handleTrain() {
  train();
}

function handleFight() {
  startCombat();
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

.stats {
  display: flex;
  justify-content: space-around;
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
}

.btn-sub {
  font-size: 12px;
  opacity: 0.7;
}

.train-btn { border-color: var(--accent-color); }
.fight-btn { border-color: var(--red-color); color: var(--red-color); }

/* Combat Status */
.combat-status {
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(183, 28, 28, 0.1);
  border: 1px dashed var(--red-color);
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: bold;
}

.bars {
  display: flex;
  justify-content: space-between;
  height: 4px;
  background: #ddd;
}

.hp-bar {
  height: 100%;
  transition: width 0.3s;
}
.player-hp { background: #4caf50; }
.enemy-hp { background: #f44336; margin-left: auto; } /* Enemy bar shrinks from right? No, standard layout. Let's make them meet in middle? Simple is better. */
/* Actually, let's keep it simple. */

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
</style>
