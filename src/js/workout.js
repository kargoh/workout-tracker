import { ref, computed } from 'vue'
import { getFormattedDate, getTodayString } from '../js/calendar'

const workoutData = ref({})
const useChromeSync = ref(false)

export function useWorkoutData() {
  const todayStr = getTodayString()

  function loadData() {
    const isExtension = typeof chrome !== 'undefined' && chrome?.storage
    if (isExtension && useChromeSync.value) {
      chrome.storage.sync.get(['workoutData'], (result) => {
        workoutData.value = result.workoutData || {}
      })
    } else {
      const local = localStorage.getItem('fitcheck_workout_data')
      workoutData.value = local ? JSON.parse(local) : {}
    }
  }

  function saveData() {
    const isExtension = typeof chrome !== 'undefined' && chrome?.storage
    if (isExtension && useChromeSync.value) {
      chrome.storage.sync.set({ workoutData: workoutData.value })
    } else {
      localStorage.setItem('fitcheck_workout_data', JSON.stringify(workoutData.value))
    }
  }

  function recordAnswer(dateKey, answer) {
    if (dateKey > todayStr) return

    if (workoutData.value[dateKey] === answer) {
      delete workoutData.value[dateKey]
    } else {
      workoutData.value[dateKey] = answer
    }

    saveData()
  }

  function clearAllData() {
    workoutData.value = {}
    saveData()
  }

  // --- Calculations ---
  const currentStreak = computed(() => {
    let streak = 0
    let checkDate = new Date()

    while (true) {
      const key = getFormattedDate(checkDate)
      const ans = workoutData.value[key]

      if (ans === 'yes') {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (key === todayStr && !ans) {
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  })

  function getMonthlyStats(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    let workouts = 0
    let loggedDays = 0

    Object.entries(workoutData.value).forEach(([key, val]) => {
      if (key.startsWith(prefix)) {
        if (val === 'yes') workouts++
        loggedDays++
      }
    })

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
    const rate = loggedDays > 0 ? Math.round((workouts / totalDaysInMonth) * 100) : 0

    return { workouts, rate }
  }

  return {
    workoutData,
    useChromeSync,
    currentStreak,
    loadData,
    recordAnswer,
    clearAllData,
    getMonthlyStats
  }
}