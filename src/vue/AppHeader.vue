<script setup>
defineProps({
  useSync: Boolean
})

const emit = defineEmits(['toggleSync'])
</script>

<template>
  <header class="app-header">
    <div class="header-title">
      <span class="logo-icon">💪</span>
      <h1>FitCheck</h1>
    </div>
    <div class="storage-toggle">
      <label class="switch-sm" title="Toggle Google Profile Sync">
        <input 
          type="checkbox" 
          :checked="useSync" 
          @change="emit('toggleSync', $event.target.checked)"
        >
        <span class="slider-sm round"></span>
      </label>
      <span class="sync-label">{{ useSync ? 'Chrome Sync' : 'Local Storage' }}</span>
    </div>
  </header>
</template>