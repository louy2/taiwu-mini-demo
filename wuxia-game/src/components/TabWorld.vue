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

    <!-- Actions Area (Top) -->
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

    <!-- Logs Area (Takes remaining space) -->
    <section class="logs-container" ref="logsContainer">
      <div v-for="log in state.logs" :key="log.id" class="log-entry" :class="log.type">
        <span class="time">[{{ log.timestamp.split(' ')[0] }}]</span>
        <span class="text">
          {{ log.text }}
          <span v-if="log.reportId" class="link-text" @click="$emit('open-report', log.reportId)">[查看战报]</span>
        </span>
      </div>
      <div v-if="state.logs.length === 0" class="empty-log">暂无江湖事迹...</div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { state, prepareCombat, meditate } from '../gameLogic';

const emit = defineEmits(['open-report']);
const logsContainer = ref(null);

function handleFight() {
  prepareCombat();
}

function handleMeditate() {
  meditate();
}

// Watch logs to scroll to top (newest first)
// Note: Logic keeps using unshift, so top is newest.
watch(() => state.logs.length, () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = 0;
  }
});
</script>

<style scoped>
.tab-world {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tab-header {
  flex: 0 0 auto;
  padding: 12px 16px;
  padding-top: env(safe-area-inset-top, 12px);
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
.header-info { font-size: 12px; color: #666; }

.actions-area {
  flex: 0 0 auto;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border-bottom: 1px solid #333;
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

.logs-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;
}

.log-entry { font-size: 14px; line-height: 1.5; color: #bbb; animation: fadeIn 0.3s ease; }
.log-entry.combat { color: #e57373; }
.log-entry.growth { color: #81c784; }
.log-entry.system { color: #90caf9; }
.time { color: #555; font-size: 12px; margin-right: 6px; }
.link-text { color: #00bcd4; text-decoration: underline; cursor: pointer; margin-left: 6px; font-size: 12px; }
.empty-log { text-align: center; color: #444; margin-top: 40px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
