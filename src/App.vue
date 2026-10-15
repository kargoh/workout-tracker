<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTodayString } from './js/calendar'
import { useWorkoutData } from './js/workout'

import AppHeader from './vue/AppHeader.vue'
import DailyQuestionCard from './vue/Question.vue'
import StatsOverview from './vue/Stats.vue'
import CalendarGrid from './vue/Calendar.vue'
import AppFooter from './vue/AppFooter.vue'

const { 
  workoutData, 
  useChromeSync, 
  currentStreak, 
  loadData, 
  recordAnswer, 
  clearAllData, 
  getMonthlyStats 
} = useWorkoutData()

const todayStr = getTodayString()
const selectedDate = ref(todayStr)
const viewingYear = ref(new Date().getFullYear())
const viewingMonth = ref(new Date().getMonth())

const activeAnswer = computed(() => workoutData.value[selectedDate.value] || null)
const monthlyStats = computed(() => getMonthlyStats(viewingYear.value, viewingMonth.value))

function handleSyncToggle(isSync) {
  useChromeSync.value = isSync
  loadData()
}

function handleAnswer(ans) {
  recordAnswer(selectedDate.value, ans)
}

function jumpToToday() {
  const now = new Date()
  selectedDate.value = todayStr
  viewingYear.value = now.getFullYear()
  viewingMonth.value = now.getMonth()
}

function handleClear() {
  if (confirm('Are you sure you want to reset all workout data?')) {
    clearAllData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app-container">
    <!-- <AppHeader 
      :useSync="useChromeSync" 
      @toggleSync="handleSyncToggle" 
    /> -->
    
    <DailyQuestionCard 
      :selectedDate="selectedDate" 
      :activeAnswer="activeAnswer" 
      @answer="handleAnswer" 
    />

    <StatsOverview 
      :streak="currentStreak" 
      :monthlyWorkouts="monthlyStats.workouts" 
      :completionRate="monthlyStats.rate" 
    />

    <CalendarGrid 
      v-model:month="viewingMonth" 
      v-model:year="viewingYear" 
      :selectedDate="selectedDate" 
      :workoutData="workoutData" 
      @selectDate="(date) => selectedDate = date" 
    />
<!-- 
    <AppFooter 
      @jumpToToday="jumpToToday" 
      @clearData="handleClear" 
    /> -->
  </div>
</template>