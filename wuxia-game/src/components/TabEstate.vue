<template>
  <div class="tab-estate">
    <!-- Header -->
    <header class="tab-header estate-header">
       <div class="res-item">金钱: {{ state.player.money }}</div>
       <div class="res-item">威望: {{ state.player.prestige }}</div>
    </header>

    <div class="content-scroll">
      <div class="estate-row">
        <!-- Market -->
        <div class="building-card">
            <div class="b-title">市集 (Lv.{{ state.player.estate.marketLevel }})</div>
            <div class="b-desc">月产金钱: {{ state.player.estate.marketLevel * 100 }}</div>
            <div class="btn-row">
              <button class="up-btn" @click="upgradeBuilding('market')">扩建 (-{{ state.player.estate.marketLevel * 500 }}金)</button>
              <button class="draw-btn" @click="drawEquipment">淘装备 (-500金)</button>
            </div>
            <div class="b-note">在市集可能淘到稀有兵器或护甲。</div>
        </div>

        <!-- Ancestral Hall -->
        <div class="building-card">
            <div class="b-title">祠堂 (Lv.{{ state.player.estate.hallLevel }})</div>
            <div class="b-desc">月产威望: {{ state.player.estate.hallLevel * 10 }}</div>
            <div class="btn-row">
              <button class="up-btn" @click="upgradeBuilding('hall')">修缮 (-{{ state.player.estate.hallLevel * 50 }}威)</button>
              <button class="draw-btn" @click="drawKungFu">访名师 (-1000威)</button>
            </div>
            <div class="b-note">消耗威望寻访名师，可领悟绝世神功。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { state, upgradeBuilding, drawKungFu, drawEquipment } from '../gameLogic';
</script>

<style scoped>
.tab-estate {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-header {
  flex: 0 0 auto;
  padding: 12px 16px;
  padding-top: env(safe-area-inset-top, 12px);
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.res-item { font-weight: bold; font-size: 16px; color: #00bcd4; }

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.estate-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.building-card {
  background: rgba(255,255,255,0.05);
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #444;
}

.b-title { font-weight: bold; font-size: 16px; color: #eee; margin-bottom: 4px; }
.b-desc { font-size: 13px; color: #888; margin-bottom: 12px; }
.b-note { font-size: 12px; color: #555; margin-top: 12px; font-style: italic; }

.btn-row {
  display: flex;
  gap: 12px;
}

.up-btn, .draw-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background: #333;
  color: #ccc;
  white-space: nowrap;
}
.up-btn:active, .draw-btn:active { background: #444; }
</style>
