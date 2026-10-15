<script setup>
import { ref, computed, onMounted } from 'vue'

// --- State ---
const todayStr = getFormattedDate(new Date())
const selectedDate = ref(todayStr)
const viewingYear = ref(new Date().getFullYear())
const viewingMonth = ref(new Date().getMonth())
const useChromeSync = ref(false)
const workoutData = ref({}) // Format: { 'YYYY-MM-DD': 'yes' | 'no' }

// --- Helpers ---
function getFormattedDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseFormattedDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// --- Computed Properties ---
const selectedDateFormatted = computed(() => {
  if (selectedDate.value === todayStr) return 'Today'
  const dateObj = parseFormattedDate(selectedDate.value)
  return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
})

const activeAnswer = computed(() => workoutData.value[selectedDate.value] || null)

const monthYearLabel = computed(() => `${monthNames[viewingMonth.value]} ${viewingYear.value}`)

// Calendar grid matrix generation
const calendarDays = computed(() => {
  const firstDayIndex = new Date(viewingYear.value, viewingMonth.value, 1).getDay()
  const totalDays = new Date(viewingYear.value, viewingMonth.value + 1, 0).getDate()
  const days = []

  // Empty leading cells
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ id: `empty-${i}`, isEmpty: true })
  }

  // Actual days
  for (let day = 1; day <= totalDays; day++) {
    const mm = String(viewingMonth.value + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const dateKey = `${viewingYear.value}-${mm}-${dd}`

    days.push({
      id: dateKey,
      dayNumber: day,
      dateKey,
      isEmpty: false,
      answer: workoutData.value[dateKey] || null,
      isToday: dateKey === todayStr,
      isSelected: dateKey === selectedDate.value,
      isFuture: dateKey > todayStr
    })
  }

  return days
})

// Streak and stats
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
      // Don't break streak if today is not recorded yet
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
})

const monthlyStats = computed(() => {
  const prefix = `${viewingYear.value}-${String(viewingMonth.value + 1).padStart(2, '0')}`
  let workouts = 0
  let loggedDays = 0

  Object.entries(workoutData.value).forEach(([key, val]) => {
    if (key.startsWith(prefix)) {
      if (val === 'yes') workouts++
      loggedDays++
    }
  })

  const totalDaysInMonth = new Date(viewingYear.value, viewingMonth.value + 1, 0).getDate()
  const rate = loggedDays > 0 ? Math.round((workouts / totalDaysInMonth) * 100) : 0

  return { workouts, rate }
})

// --- Storage Management ---
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

function handleSyncToggle() {
  loadData()
}

// --- Action Methods ---
function recordAnswer(answer) {
  if (selectedDate.value > todayStr) return

  if (workoutData.value[selectedDate.value] === answer) {
    delete workoutData.value[selectedDate.value]
  } else {
    workoutData.value[selectedDate.value] = answer
  }

  saveData()
}

function selectDay(day) {
  if (day.isFuture || day.isEmpty) return
  selectedDate.value = day.dateKey
}

function prevMonth() {
  viewingMonth.value--
  if (viewingMonth.value < 0) {
    viewingMonth.value = 11
    viewingYear.value--
  }
}

function nextMonth() {
  viewingMonth.value++
  if (viewingMonth.value > 11) {
    viewingMonth.value = 0;
    viewingYear.value++
  }
}

function jumpToToday() {
  const now = new Date()
  selectedDate.value = todayStr
  viewingYear.value = now.getFullYear()
  viewingMonth.value = now.getMonth()
}

function clearAllData() {
  if (confirm('Are you sure you want to reset all workout data?')) {
    workoutData.value = {}
    saveData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app-container">
    <!-- Header / Sync Switch -->
    <header class="app-header">
      <div class="header-title">
        <span class="logo-icon">💪</span>
        <h1>FitCheck</h1>
      </div>
      <div class="storage-toggle">
        <label class="switch-sm" title="Toggle Google Profile Sync">
          <input type="checkbox" v-model="useChromeSync" @change="handleSyncToggle">
          <span class="slider-sm round"></span>
        </label>
        <span class="sync-label">{{ useChromeSync ? 'Chrome Sync' : 'Local Storage' }}</span>
      </div>
    </header>

    <!-- Main Question Section -->
    <section class="question-card">
      <div class="selected-date-indicator">{{ selectedDateFormatted }}</div>
      <h2 class="question-text">Have you worked out today?</h2>

      <div class="toggle-container">
        <button 
          class="toggle-btn btn-no" 
          :class="{ active: activeAnswer === 'no' }" 
          @click="recordAnswer('no')"
        >
          ✕ No
        </button>
        <button 
          class="toggle-btn btn-yes" 
          :class="{ active: activeAnswer === 'yes' }" 
          @click="recordAnswer('yes')"
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

    <!-- Stats Summary -->
    <section class="stats-row">
      <div class="stat-badge">
        <span class="stat-value">{{ currentStreak }}</span>
        <span class="stat-label">Day Streak 🔥</span>
      </div>
      <div class="stat-badge">
        <span class="stat-value">{{ monthlyStats.workouts }}</span>
        <span class="stat-label">This Month 💪</span>
      </div>
      <div class="stat-badge">
        <span class="stat-value">{{ monthlyStats.rate }}%</span>
        <span class="stat-label">Completion 📈</span>
      </div>
    </section>

    <!-- Calendar Section -->
    <section class="calendar-section">
      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth">‹</button>
        <h3>{{ monthYearLabel }}</h3>
        <button class="nav-btn" @click="nextMonth">›</button>
      </div>

      <!-- Weekday Headings -->
      <div class="weekdays-grid">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      <!-- Days Grid -->
      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.id"
          class="day-square"
          :class="{
            empty: day.isEmpty,
            yes: day.answer === 'yes',
            no: day.answer === 'no',
            today: day.isToday,
            selected: day.isSelected,
            future: day.isFuture
          }"
          @click="selectDay(day)"
        >
          <template v-if="!day.isEmpty">{{ day.dayNumber }}</template>
        </div>
      </div>
    </section>

    <!-- Footer Actions -->
    <footer class="app-footer">
      <button class="icon-text-btn" @click="jumpToToday">
        📅 Jump to Today
      </button>
      <button class="icon-text-btn danger" @click="clearAllData">
        🗑 Reset Data
      </button>
    </footer>
  </div>
</template>

<style scoped>
:root {
  --bg-color: #0f172a;
  --card-bg: #1e293b;
  --card-border: #334155;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --accent-green: #22c55e;
  --accent-red: #ef4444;
  --accent-blue: #3b82f6;
}

* {
	box-sizing: border-box;
	user-select: none;
	font-size: 100%;
	touch-action: manipulation;
}

html {
	font-family: Arial, Helvetica, sans-serif;
	font-size: clamp(16px, 2vh, 32px);
	line-height: clamp(16px, 2vh, 32px);
	overflow: hidden;
}

body {
  margin: 0px !important;
}

#app {
  min-width: 640px;
  min-height: 360px;
  width: 100vw;
  height: 100vh;  
}

.app-container {
  margin: 0 auto;
  background: #1e293b;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
  padding: 16px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h1 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.storage-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-label {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Switch Styling */
.switch-sm {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 18px;
}

.switch-sm input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-sm {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #475569;
  transition: .3s;
  border-radius: 18px;
}

.slider-sm:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider-sm {
  background-color: #3b82f6;
}

input:checked + .slider-sm:before {
  transform: translateX(16px);
}

/* Question Section */
.question-card {
  text-align: center;
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  margin: 12px 0;
}

.selected-date-indicator {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #3b82f6;
}

.question-text {
  font-size: 1.05rem;
  margin: 6px 0 14px;
  font-weight: 600;
}

.toggle-container {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.toggle-btn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #334155;
  border-radius: 8px;
  background: #0f172a;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.btn-no.active {
  background-color: #ef4444;
  border-color: #ef4444;
}

.toggle-btn.btn-yes.active {
  background-color: #22c55e;
  border-color: #22c55e;
}

.status-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 8px;
}

/* Stats */
.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-badge {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Calendar */
.calendar-section {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #334155;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-header h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.nav-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 8px;
}

.nav-btn:hover {
  color: #f8fafc;
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 8px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.day-square {
  aspect-ratio: 1;
  border-radius: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.day-square.empty {
  visibility: hidden;
  cursor: default;
}

.day-square.yes {
  background-color: #22c55e;
  border-color: #22c55e;
  color: #fff;
  font-weight: 700;
}

.day-square.no {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #fff;
  font-weight: 700;
}

.day-square.today {
  box-shadow: 0 0 0 2px #3b82f6;
}

.day-square.selected {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px #fff;
  z-index: 2;
}

.day-square.future {
  opacity: 0.25;
  cursor: not-allowed;
  background: #0f172a;
}

/* Footer */
.app-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #334155;
}

.icon-text-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
}

.icon-text-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.icon-text-btn.danger:hover {
  color: #ef4444;
}
</style>