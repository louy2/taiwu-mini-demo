<template>
  <div class="tab-character">
    <!-- Status Header (Detailed) -->
    <header class="char-header">
      <div class="char-top">
        <span class="name">{{ state.player.name }}</span>
        <span class="badge">{{ state.player.neiliType }}</span>
        <span class="neili-type-hint">内力属性</span>
      </div>
      <div class="char-bars">
        <div class="bar-row">
           <span class="label">真气</span>
           <div class="bar-track">
             <div class="bar-fill qi" :style="{ width: Math.min(100, (state.player.qi / 280)*100) + '%' }"></div>
           </div>
           <span class="val">{{ state.player.qi }}/280</span>
        </div>
        <div class="qi-breakdown">
           摧破:{{ state.player.qiDestruction }} | 护体:{{ state.player.qiProtection }} | 轻灵:{{ state.player.qiAgile }} | 奇窍:{{ state.player.qiMeridian }}
        </div>
      </div>
    </header>

    <!-- Sub Navigation (Segmented Control) -->
    <div class="sub-nav">
      <button :class="{ active: subTab === 'stats' }" @click="subTab = 'stats'">属性/装备</button>
      <button :class="{ active: subTab === 'kungfu' }" @click="subTab = 'kungfu'">功法</button>
      <button :class="{ active: subTab === 'qi' }" @click="subTab = 'qi'">调息</button>
    </div>

    <!-- Content Area -->
    <div class="content-scroll">

      <!-- SUBTAB: STATS -->
      <div v-if="subTab === 'stats'" class="sub-pane">
        <!-- Equipment Slots -->
        <div class="gear-section">
          <div class="gear-slot" @click="$emit('open-inventory', 'weapon')">
            <span class="slot-label">武器</span>
            <span class="slot-val">{{ getEquippedItemName('weapon') || '未装备' }}</span>
            <span v-if="state.player.gear.weapon" class="x-btn" @click.stop="handleUnequipItem('weapon')">×</span>
          </div>
          <div class="gear-slot" @click="$emit('open-inventory', 'armor')">
            <span class="slot-label">护甲</span>
            <span class="slot-val">{{ getEquippedItemName('armor') || '未装备' }}</span>
            <span v-if="state.player.gear.armor" class="x-btn" @click.stop="handleUnequipItem('armor')">×</span>
          </div>
        </div>

        <!-- Attributes Grid -->
        <div class="stat-grid">
          <div class="stat-cell"><span class="label">力道</span><span class="val">{{ effectiveStats.power }}</span></div>
          <div class="stat-cell"><span class="label">卸力</span><span class="val">{{ effectiveStats.parry }}</span></div>
          <div class="stat-cell"><span class="label">破体</span><span class="val">{{ effectiveStats.penetration }}</span></div>
          <div class="stat-cell"><span class="label">御体</span><span class="val">{{ effectiveStats.resistance }}</span></div>
          <div class="stat-cell"><span class="label">破气</span><span class="val">{{ effectiveStats.qiBreach }}</span></div>
          <div class="stat-cell"><span class="label">御气</span><span class="val">{{ effectiveStats.qiGuard }}</span></div>
          <!-- Extended Stats -->
          <div class="stat-cell dim"><span class="label">精妙</span><span class="val">{{ effectiveStats.finesse }}</span></div>
          <div class="stat-cell dim"><span class="label">拆招</span><span class="val">{{ effectiveStats.dismantle }}</span></div>
          <div class="stat-cell dim"><span class="label">迅疾</span><span class="val">{{ effectiveStats.swiftness }}</span></div>
          <div class="stat-cell dim"><span class="label">闪避</span><span class="val">{{ effectiveStats.dodge }}</span></div>
        </div>

        <!-- Settings -->
        <div class="setting-row">
           <div class="setting-label">
             <span>内伤占比: {{ state.player.internalRatio }}%</span>
             <span class="hint">(影响造成的伤害类型)</span>
           </div>
           <input type="range" v-model.number="state.player.internalRatio" min="0" max="100" step="10" :disabled="state.combatState.inCombat">
        </div>
      </div>

      <!-- SUBTAB: KUNGFU -->
      <div v-if="subTab === 'kungfu'" class="sub-pane">
        <!-- Internal -->
        <div class="kf-section">
          <div class="kf-header">内功 ({{state.player.equipment.internal.length}}/3)</div>
          <div class="kf-desc">决定内力属性及功法槽位，需激活生效。</div>
          <div class="kf-list">
            <div v-for="(id, idx) in state.player.equipment.internal" :key="'i'+idx"
                 class="kf-chip internal"
                 :class="{ active: state.player.activeInternalId === id }"
                 @click="handleActivate(id)">
              {{ getKfName(id) }}
              <span v-if="state.player.activeInternalId === id" class="badge-mini">运</span>
              <span class="x-btn-mini" @click.stop="handleUnequip('internal', idx)">×</span>
            </div>
            <div v-if="state.player.equipment.internal.length < 3" class="kf-chip add" @click="$emit('open-inventory', 'internal')">+ 装备内功</div>
          </div>
        </div>

        <!-- Destruction -->
        <div class="kf-section">
          <div class="kf-header">摧破 ({{state.player.equipment.destruction.length}}/{{slotCapacity.destruction}})</div>
          <div class="kf-desc">消耗【势】造成伤害。</div>
          <div class="kf-list">
            <div v-for="(id, idx) in state.player.equipment.destruction" :key="'d'+idx" class="kf-chip" @click="handleUnequip('destruction', idx)">
              {{ getKfName(id) }} <span class="x-btn-mini">×</span>
            </div>
            <div v-if="state.player.equipment.destruction.length < slotCapacity.destruction" class="kf-chip add" @click="$emit('open-inventory', 'destruction')">+ 装备摧破</div>
          </div>
        </div>

        <!-- Protection -->
        <div class="kf-section">
          <div class="kf-header">护体 ({{state.player.equipment.protection.length}}/{{slotCapacity.protection}})</div>
          <div class="kf-desc">消耗【提气】抵御伤害。</div>
          <div class="kf-list">
            <div v-for="(id, idx) in state.player.equipment.protection" :key="'p'+idx" class="kf-chip" @click="handleUnequip('protection', idx)">
              {{ getKfName(id) }} <span class="x-btn-mini">×</span>
            </div>
             <div v-if="state.player.equipment.protection.length < slotCapacity.protection" class="kf-chip add" @click="$emit('open-inventory', 'protection')">+ 装备护体</div>
          </div>
        </div>
      </div>

      <!-- SUBTAB: QI -->
      <div v-if="subTab === 'qi'" class="sub-pane qi-pane">
         <div class="qi-info-text">
           剩余可用真气: <span class="hl">{{ state.player.qi - getUsedQi() }}</span>
         </div>

         <div class="qi-row">
           <span class="qi-name">摧破 (攻)</span>
           <div class="qi-ctrl">
             <button @click="allocateQi('destruction', -1)">-</button>
             <span class="qi-val">{{ state.player.qiDestruction }}</span>
             <button @click="allocateQi('destruction', 1)">+</button>
             <button class="qi-max-btn" @click="allocateAllQi('destruction')">全</button>
           </div>
         </div>
         <div class="qi-row">
           <span class="qi-name">轻灵 (攻/防)</span>
           <div class="qi-ctrl">
             <button @click="allocateQi('agile', -1)">-</button>
             <span class="qi-val">{{ state.player.qiAgile || 0 }}</span>
             <button @click="allocateQi('agile', 1)">+</button>
             <button class="qi-max-btn" @click="allocateAllQi('agile')">全</button>
           </div>
         </div>
         <div class="qi-row">
           <span class="qi-name">护体 (防)</span>
           <div class="qi-ctrl">
             <button @click="allocateQi('protection', -1)">-</button>
             <span class="qi-val">{{ state.player.qiProtection }}</span>
             <button @click="allocateQi('protection', 1)">+</button>
             <button class="qi-max-btn" @click="allocateAllQi('protection')">全</button>
           </div>
         </div>
         <div class="qi-row">
           <span class="qi-name">奇窍 (攻/防)</span>
           <div class="qi-ctrl">
             <button @click="allocateQi('meridian', -1)">-</button>
             <span class="qi-val">{{ state.player.qiMeridian || 0 }}</span>
             <button @click="allocateQi('meridian', 1)">+</button>
             <button class="qi-max-btn" @click="allocateAllQi('meridian')">全</button>
           </div>
         </div>

         <div class="qi-actions">
           <button class="qi-btn" @click="allocateEvenly">平均分配</button>
           <button class="qi-btn reset" @click="resetQiAllocation">重置</button>
         </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  state, effectiveStats, slotCapacity,
  activateInternal, unequipKungFu, unequipItem,
  allocateQi, allocateAllQi, allocateEvenly, resetQiAllocation, getUsedQi
} from '../gameLogic';
import { KUNGFU_DEFINITIONS } from '../data/kungfu';
import { ITEM_DEFINITIONS } from '../data/items';

defineEmits(['open-inventory']);

const subTab = ref('stats');

function handleActivate(id) {
    if(!state.combatState.inCombat) activateInternal(id);
}
function handleUnequip(t, i) { if(!state.combatState.inCombat) unequipKungFu(t, i); }
function handleUnequipItem(slot) { if(!state.combatState.inCombat) unequipItem(slot); }

function getKfName(id) {
  const base = KUNGFU_DEFINITIONS[id]?.name || id;
  const count = state.player.itemCounts?.[id] || 0;
  return count > 0 ? `${base} +${count}` : base;
}

function getItemName(id) {
  const base = ITEM_DEFINITIONS[id]?.name || id;
  const count = state.player.itemCounts?.[id] || 0;
  return count > 0 ? `${base} +${count}` : base;
}
function getEquippedItemName(slot) {
  const id = state.player.gear[slot];
  return id ? getItemName(id) : '';
}
</script>

<style scoped>
.tab-character {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.char-header {
  flex: 0 0 auto;
  padding: 16px;
  padding-top: env(safe-area-inset-top, 16px);
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}
.char-top { display: flex; align-items: baseline; margin-bottom: 12px; }
.name { font-size: 20px; font-weight: bold; margin-right: 8px; color: #fff; }
.badge { font-size: 12px; background: #333; padding: 2px 6px; border-radius: 4px; color: #00bcd4; margin-right: 4px; }
.neili-type-hint { font-size: 10px; color: #666; }

.char-bars { display: flex; flex-direction: column; gap: 4px; }
.bar-row { display: flex; align-items: center; gap: 8px; }
.label { font-size: 12px; color: #aaa; width: 30px; }
.bar-track { flex: 1; height: 8px; background: #333; border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: #00bcd4; }
.bar-fill.qi { background: #ab47bc; }
.val { font-size: 10px; color: #888; width: 60px; text-align: right; }
.qi-breakdown { font-size: 10px; color: #555; margin-left: 38px; }

.sub-nav {
  flex: 0 0 auto;
  display: flex;
  background: #222;
  border-bottom: 1px solid #333;
}
.sub-nav button {
  flex: 1;
  padding: 12px;
  font-size: 13px;
  color: #777;
  border-bottom: 2px solid transparent;
}
.sub-nav button.active {
  color: #fff;
  border-bottom-color: #00bcd4;
  background: rgba(255,255,255,0.02);
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 30px;
}

.sub-pane { display: flex; flex-direction: column; gap: 20px; }

/* Stats Pane */
.gear-section { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.gear-slot { background: #333; padding: 12px; border-radius: 4px; display: flex; flex-direction: column; position: relative; cursor: pointer; border: 1px solid #444; }
.slot-label { font-size: 10px; color: #888; }
.slot-val { font-size: 14px; font-weight: bold; margin-top: 4px; color: #ddd; }
.x-btn { position: absolute; top: 4px; right: 8px; font-size: 14px; color: #888; }

.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stat-cell { display: flex; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 4px; border: 1px solid #333; }
.stat-cell.dim { opacity: 0.7; border: 1px dashed #333; }
.stat-cell .label { color: #888; font-size: 12px; }
.stat-cell .val { font-weight: bold; font-size: 14px; color: #eee; }

.setting-row { background: #1e1e1e; padding: 12px; border-radius: 4px; border: 1px solid #333; }
.setting-label { display: flex; justify-content: space-between; font-size: 12px; color: #ccc; margin-bottom: 8px; }
.setting-label .hint { color: #666; }
input[type=range] { width: 100%; }

/* KungFu Pane */
.kf-section { display: flex; flex-direction: column; gap: 8px; }
.kf-header { font-size: 14px; font-weight: bold; color: #ddd; }
.kf-desc { font-size: 11px; color: #666; margin-bottom: 4px; }
.kf-list { display: flex; gap: 8px; flex-wrap: wrap; }
.kf-chip {
  padding: 8px 12px; background: #333; font-size: 12px; border-radius: 20px; cursor: pointer;
  display: flex; align-items: center; border: 1px solid #444; color: #ccc;
}
.kf-chip.internal.active { border-color: #00bcd4; color: #00bcd4; background: rgba(0, 188, 212, 0.1); }
.kf-chip.add { background: transparent; border: 1px dashed #666; color: #888; }
.badge-mini { font-size: 10px; background: #00bcd4; color: #000; padding: 0 4px; border-radius: 4px; margin-left: 6px; }
.x-btn-mini { margin-left: 6px; color: #666; font-weight: bold; font-size: 14px; }
.x-btn-mini:hover { color: #ef5350; }

/* Qi Pane */
.qi-pane { padding: 0 8px; }
.qi-info-text { text-align: center; margin-bottom: 16px; color: #888; font-size: 14px; }
.qi-info-text .hl { color: #00bcd4; font-weight: bold; font-size: 18px; }
.qi-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #222; }
.qi-name { font-size: 14px; color: #ccc; }
.qi-ctrl { display: flex; align-items: center; gap: 12px; }
.qi-ctrl button { width: 32px; height: 32px; background: #333; border-radius: 50%; font-weight: bold; font-size: 18px; line-height: 1; color: #ddd; border: 1px solid #444; }
.qi-ctrl button.qi-max-btn { width: 32px; height: 32px; background: #222; color: #888; font-size: 12px; border-radius: 4px; border: 1px solid #333; }
.qi-val { font-size: 18px; font-weight: bold; width: 36px; text-align: center; color: #fff; }
.qi-actions { display: flex; justify-content: center; gap: 16px; margin-top: 20px; }
.qi-btn { padding: 10px 24px; background: #333; border-radius: 4px; font-size: 13px; border: 1px solid #444; color: #eee; }
.qi-btn.reset { color: #ef5350; border-color: #ef5350; background: rgba(239,83,80,0.1); }
</style>
