<script setup>
defineProps({
  streak: Number,
  monthlyWorkouts: Number,
  completionRate: Number
})
</script>

<template>
  <section class="stats-row">
    <div class="stat-badge">
      <span class="stat-value">{{ streak }}</span>
      <span class="stat-label">Day Streak 🔥</span>
    </div>
    <div class="stat-badge">
      <span class="stat-value">{{ monthlyWorkouts }}</span>
      <span class="stat-label">This Month 💪</span>
    </div>
    <div class="stat-badge">
      <span class="stat-value">{{ completionRate }}%</span>
      <span class="stat-label">Completion 📈</span>
    </div>
  </section>
</template>