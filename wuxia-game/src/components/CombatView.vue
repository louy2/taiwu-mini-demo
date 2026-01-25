<template>
  <div class="combat-view">

    <!-- === PREP PHASE === -->
    <div v-if="state.combatState.phase === 'prep'" class="cv-scene prep">
      <h2 class="scene-title">遭遇强敌</h2>
      <div class="vs-container">
        <!-- Player -->
        <div class="fighter-card player">
          <div class="f-name">{{ state.player.name }}</div>
          <div class="f-type">{{ state.player.neiliType }}</div>
          <div class="f-stats">
            <div class="stat-row"><span>力道</span><span>{{ effectiveStats.power }}</span></div>
            <div class="stat-row"><span>卸力</span><span>{{ effectiveStats.parry }}</span></div>
            <div class="stat-row"><span>破体</span><span>{{ effectiveStats.penetration }}</span></div>
            <div class="stat-row"><span>御体</span><span>{{ effectiveStats.resistance }}</span></div>
            <div class="stat-row"><span>破气</span><span>{{ effectiveStats.qiBreach }}</span></div>
            <div class="stat-row"><span>御气</span><span>{{ effectiveStats.qiGuard }}</span></div>
            <div class="stat-row"><span>内伤比</span><span>{{ state.player.internalRatio }}%</span></div>
          </div>
        </div>

        <div class="vs-divider">VS</div>

        <!-- Enemy -->
        <div class="fighter-card enemy">
          <div class="f-name">{{ state.combatState.enemy.name }}</div>
          <div class="f-type">{{ state.combatState.enemy.neiliType }}</div>
          <div class="f-stats">
            <div class="stat-row"><span>力道</span><span>{{ state.combatState.enemy.power }}</span></div>
            <div class="stat-row"><span>卸力</span><span>{{ state.combatState.enemy.parry }}</span></div>
            <div class="stat-row"><span>破体</span><span>{{ state.combatState.enemy.penetration }}</span></div>
            <div class="stat-row"><span>御体</span><span>{{ state.combatState.enemy.resistance }}</span></div>
            <div class="stat-row"><span>破气</span><span>{{ state.combatState.enemy.qiBreach }}</span></div>
            <div class="stat-row"><span>御气</span><span>{{ state.combatState.enemy.qiGuard }}</span></div>
            <div class="stat-row"><span>内伤比</span><span>{{ state.combatState.enemy.internalRatio }}%</span></div>
          </div>
        </div>
      </div>

      <button class="big-btn start" @click="startFighting">开始战斗</button>
    </div>

    <!-- === ACTIVE PHASE === -->
    <div v-if="state.combatState.phase === 'active'" class="cv-scene active">
      <!-- Top Half: Status -->
      <div class="cv-top">
        <div class="status-header">
           <!-- Player HP -->
           <div class="hp-group">
             <div class="hp-name">{{ state.player.name }}</div>
             <div class="hp-track">
               <div class="hp-fill player" :style="{ width: playerHpPct + '%' }"></div>
             </div>
             <div class="hp-meta">伤势: {{ state.combatState.playerMarks }}/12</div>
           </div>

           <!-- Resources -->
           <div class="res-display">
             <div>势: {{ state.player.resources.shi }}</div>
             <div>气: {{ Math.floor(state.player.resources.tiqi/1000) }}k</div>
           </div>

           <!-- Enemy HP -->
           <div class="hp-group">
             <div class="hp-name enemy">{{ state.combatState.enemy.name }}</div>
             <div class="hp-track">
               <div class="hp-fill enemy" :style="{ width: enemyHpPct + '%' }"></div>
             </div>
             <div class="hp-meta">伤势: {{ state.combatState.enemyMarks }}/12</div>
           </div>
        </div>
      </div>

      <!-- Bottom Half: Logs -->
      <div class="cv-bottom" ref="combatLogsRef">
        <div v-for="(log, idx) in state.combatState.currentBattleLogs" :key="idx" class="cv-log-item">
          {{ log.text }}
        </div>
        <div id="log-anchor"></div>
      </div>

      <!-- Controls -->
      <div class="cv-controls">
         <button class="skip-btn" @click="skipCombat" v-if="!state.combatState.skipping">>> 速战速决</button>
         <div v-else class="skipping-text">极速演算中...</div>
      </div>
    </div>

    <!-- === RESULT PHASE === -->
    <div v-if="state.combatState.phase === 'result'" class="cv-scene result">
      <h2 class="scene-title">{{ lastResultTitle }}</h2>
      <div class="result-summary">
        {{ lastResultSummary }}
      </div>
      <div class="result-logs">
         <div v-for="(log, idx) in state.combatState.currentBattleLogs.slice(-5)" :key="idx" class="cv-log-item">
           {{ log.text }}
         </div>
      </div>
      <button class="big-btn return" @click="exitCombat">返回江湖</button>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { state, effectiveStats, startFighting, skipCombat, exitCombat } from '../gameLogic';

const combatLogsRef = ref(null);

// HP Calculation
const playerHpPct = computed(() => Math.max(0, (1 - state.combatState.playerMarks / 12) * 100));
const enemyHpPct = computed(() => {
  if (!state.combatState.enemyMarks) return 100;
  return Math.max(0, (1 - state.combatState.enemyMarks / 12) * 100);
});

// Auto Scroll
watch(() => state.combatState.currentBattleLogs.length, async () => {
  if (state.combatState.phase === 'active' && combatLogsRef.value) {
    await nextTick();
    const el = combatLogsRef.value;
    el.scrollTop = el.scrollHeight;
  }
});

// Result
const lastResultTitle = computed(() => {
  if (state.combatState.playerMarks >= 12) return "胜败乃兵家常事";
  return "大获全胜";
});

const lastResultSummary = computed(() => {
    return state.combatState.currentBattleLogs[state.combatState.currentBattleLogs.length - 1]?.text || '战斗结束';
});

</script>

<style scoped>
.combat-view {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #111; z-index: 200;
  display: flex; flex-direction: column;
  color: #ccc;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.cv-scene {
  flex: 1; display: flex; flex-direction: column;
  padding: 20px; box-sizing: border-box;
}

.scene-title {
  text-align: center; color: #eee; letter-spacing: 2px;
  border-bottom: 1px solid #333; padding-bottom: 10px;
}

/* Prep */
.prep { align-items: center; justify-content: center; gap: 20px; }
.vs-container { display: flex; align-items: center; gap: 10px; width: 100%; justify-content: center; }
.fighter-card {
  flex: 1; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center;
  border: 1px solid #333;
}
.fighter-card.enemy { border-color: #522; background: rgba(255,100,100,0.05); }
.vs-divider { font-size: 24px; font-weight: bold; color: #888; font-style: italic; }
.f-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #fff; text-align: center; }
.f-type { font-size: 12px; color: #00bcd4; margin-bottom: 12px; }
.f-stats { width: 100%; display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.stat-row { display: flex; justify-content: space-between; color: #aaa; }
.stat-row span:last-child { color: #eee; font-weight: bold; }

.big-btn {
  padding: 16px 40px; font-size: 18px; font-weight: bold;
  background: #00bcd4; color: #000; border-radius: 4px;
  margin-top: 20px;
}
.big-btn.return { background: #444; color: #fff; }

/* Active */
.cv-scene.active { padding: 0; }
.cv-top {
  flex: 0 0 auto; /* Fixed height based on content */
  background: #1a1a1a; border-bottom: 1px solid #333;
  padding: 16px; display: flex; flex-direction: column; justify-content: center;
}
.status-header { display: flex; flex-direction: column; gap: 16px; }
.hp-group { display: flex; flex-direction: column; gap: 4px; }
.hp-name { font-size: 14px; color: #fff; font-weight: bold; }
.hp-name.enemy { color: #ef5350; text-align: right; }
.hp-track { height: 10px; background: #333; border-radius: 5px; overflow: hidden; width: 100%; }
.hp-fill { height: 100%; transition: width 0.3s; background: #4caf50; }
.hp-fill.enemy { background: #ef5350; float: right; } /* Float right for enemy bar filling from right? Or just standard LTR? Standard LTR is less confusing usually. */
/* User didn't specify direction. Standard LTR is safer. */
.hp-fill.enemy { float: none; }

.hp-meta { font-size: 12px; color: #888; }
.res-display {
  display: flex; justify-content: center; gap: 20px;
  font-size: 14px; color: #00bcd4; font-weight: bold;
  background: rgba(0,0,0,0.3); padding: 4px; border-radius: 4px;
}

.cv-bottom {
  flex: 1; /* Fill remaining space */
  min-height: 0; /* Allow shrinking for scroll */
  overflow-y: auto;
  overscroll-behavior: contain; /* Prevent scroll chaining */
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  background: #000; display: flex; flex-direction: column; gap: 8px;
  padding-bottom: 60px; /* Space for control */
}
.cv-log-item { font-size: 14px; line-height: 1.5; color: #bbb; border-bottom: 1px dashed #222; padding-bottom: 4px; }
.cv-controls {
  position: absolute; bottom: 20px; left: 0; width: 100%;
  display: flex; justify-content: center; pointer-events: none;
}
.skip-btn {
  pointer-events: auto;
  background: rgba(239, 83, 80, 0.9); color: #fff;
  padding: 8px 24px; border-radius: 20px;
  font-size: 14px; font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.skipping-text {
  background: rgba(0,0,0,0.7); color: #aaa; padding: 4px 12px; border-radius: 12px; font-size: 12px;
}

/* Result */
.result { align-items: center; justify-content: center; gap: 20px; text-align: center; }
.result-summary { font-size: 16px; color: #fff; margin: 20px 0; }
.result-logs {
    width: 100%; max-height: 150px; overflow-y: auto;
    background: #1a1a1a; padding: 10px; border-radius: 4px;
    font-size: 12px; color: #888; text-align: left;
}

</style>
