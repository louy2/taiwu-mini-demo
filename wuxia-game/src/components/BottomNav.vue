<template>
  <div class="bottom-nav">
    <button
      class="nav-item"
      :class="{ active: currentTab === 'world' }"
      @click="$emit('update:currentTab', 'world')"
    >
      世界
    </button>
    <button
      class="nav-item"
      :class="{ active: currentTab === 'character' }"
      @click="$emit('update:currentTab', 'character')"
    >
      角色
    </button>
    <button
      class="nav-item"
      :class="{ active: currentTab === 'estate' }"
      @click="$emit('update:currentTab', 'estate')"
    >
      产业
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentTab: String
});
defineEmits(['update:currentTab']);
</script>

<style scoped>
.bottom-nav {
  display: flex;
  background: #222;
  border-top: 1px solid #333;
  padding-bottom: env(safe-area-inset-bottom);
  flex: 0 0 auto;
}
.nav-item {
  flex: 1;
  padding: 16px 0;
  text-align: center;
  font-size: 14px;
  color: #777;
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  cursor: pointer;
}
.nav-item.active {
  color: #00bcd4;
  border-top-color: #00bcd4;
  background: rgba(255, 255, 255, 0.02);
}
</style>
