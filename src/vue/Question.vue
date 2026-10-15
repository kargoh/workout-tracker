<script setup>
import { computed } from 'vue'
import { parseFormattedDate, getTodayString } from '../js/calendar'

const props = defineProps({
  selectedDate: { type: String, required: true },
  activeAnswer: { type: String, default: null }
})

const emit = defineEmits(['answer'])

const selectedDateFormatted = computed(() => {
  if (props.selectedDate === getTodayString()) return 'Today'
  const dateObj = parseFormattedDate(props.selectedDate)
  return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})
</script>

<template>
  <section class="question-card">
    <div class="selected-date-indicator">{{ selectedDateFormatted }}</div>
    <h2 class="question-text">Have you worked out today?</h2>

    <div class="toggle-container">
      <button 
        class="toggle-btn btn-no" 
        :class="{ active: activeAnswer === 'no' }" 
        @click="emit('answer', 'no')"
      >
        ✕ No
      </button>
      <button 
        class="toggle-btn btn-yes" 
        :class="{ active: activeAnswer === 'yes' }" 
        @click="emit('answer', 'yes')"
      >
        ✓ Yes
      </button>
    </div>
    <p class="status-hint">
      <template v-if="activeAnswer === 'yes'">Recorded: Worked out! 💪</template>
      <template v-else-if="activeAnswer === 'no'">Recorded: Rest/No workout 😴</template>
      <template v-else>Select an option to record for this day</template>
    </p>
  </section>
</template>