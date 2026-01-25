<template>
  <section class="global-logs" ref="logsContainer">
    <div v-for="log in state.logs" :key="log.id" class="log-entry" :class="log.type">
      <span class="time">[{{ log.timestamp.split(' ')[0] }}]</span>
      <span class="text">
        {{ log.text }}
        <span v-if="log.reportId" class="link-text" @click="$emit('open-report', log.reportId)">[查看战报]</span>
      </span>
    </div>
    <div v-if="state.logs.length === 0" class="empty-log">暂无江湖事迹...</div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue';
import { state } from '../gameLogic';

const emit = defineEmits(['open-report']);
const logsContainer = ref(null);

// Watch logs to scroll to top (newest first)
// Logs are unshifted (newest at index 0), so scrollTop=0 is correct.
watch(() => state.logs.length, () => {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = 0;
  }
});
</script>

<style scoped>
.global-logs {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-top: max(16px, env(safe-area-inset-top));
  display: flex;
  flex-direction: column;
  gap: 8px;
  -webkit-overflow-scrolling: touch;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid #333;
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
