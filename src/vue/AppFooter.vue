<script setup>
const emit = defineEmits(['jumpToToday', 'clearData'])
</script>

<template>
  <footer class="app-footer">
    <button class="icon-text-btn" @click="emit('jumpToToday')">
      📅 Jump to Today
    </button>
    <button class="icon-text-btn danger" @click="emit('clearData')">
      🗑 Reset Data
    </button>
  </footer>
</template>