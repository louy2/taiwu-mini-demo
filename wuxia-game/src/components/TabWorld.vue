<template>
  <div class="tab-world">
    <!-- Header -->
    <header class="tab-header">
      <span class="header-title">江湖</span>
      <span class="header-info">
        {{ new Date().toLocaleDateString() }}
        <span v-if="state.combatState.inCombat" style="color: #ef5350">(战斗中)</span>
      </span>
    </header>

    <!-- Actions Area -->
    <section class="actions-area">
      <button @click="handleFight" class="action-btn fight" :disabled="state.combatState.inCombat">
        <span class="btn-l">战斗</span>
        <span class="btn-s">寻找对手</span>
      </button>
      <button @click="handleMeditate" class="action-btn train" :disabled="state.combatState.inCombat">
        <span class="btn-l">运转周天</span>
        <span class="btn-s">月度流转 / 产出</span>
      </button>
    </section>
  </div>
</template>

<script setup>
import { state, prepareCombat, meditate } from '../gameLogic';

function handleFight() {
  prepareCombat();
}

function handleMeditate() {
  meditate();
}
</script>

<style scoped>
.tab-world {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.tab-header {
  flex: 0 0 auto;
  padding: 12px 16px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
.header-info { font-size: 12px; color: #666; }

.actions-area {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: #1e1e1e;
}

.action-btn {
  border: 1px solid #444;
  padding: 16px;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ddd;
}
.action-btn:active { background: rgba(255,255,255,0.1); }
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-l { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
.btn-s { font-size: 10px; color: #888; }
</style>
