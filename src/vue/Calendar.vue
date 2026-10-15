<script setup>
import { computed } from 'vue'
import { MONTH_NAMES, getTodayString } from '../js/calendar'

const props = defineProps({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  selectedDate: { type: String, required: true },
  workoutData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:month', 'update:year', 'selectDate'])

const todayStr = getTodayString()

// Safely format header label
const monthYearLabel = computed(() => {
  if (props.month === undefined || props.year === undefined) return ''
  return `${MONTH_NAMES[props.month]} ${props.year}`
})

const calendarDays = computed(() => {
  if (props.month === undefined || props.year === undefined) return []

  const firstDayIndex = new Date(props.year, props.month, 1).getDay()
  const totalDays = new Date(props.year, props.month + 1, 0).getDate()
  const days = []

  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ id: `empty-${i}`, isEmpty: true })
  }

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(props.month + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    const dateKey = `${props.year}-${mm}-${dd}`

    days.push({
      id: dateKey,
      dayNumber: day,
      dateKey,
      isEmpty: false,
      answer: props.workoutData[dateKey] || null,
      isToday: dateKey === todayStr,
      isSelected: dateKey === props.selectedDate,
      isFuture: dateKey > todayStr
    })
  }

  return days
})

function prevMonth() {
  let m = props.month - 1
  let y = props.year
  if (m < 0) {
    m = 11
    y--
  }
  emit('update:month', m)
  emit('update:year', y)
}

function nextMonth() {
  let m = props.month + 1
  let y = props.year
  if (m > 11) {
    m = 0
    y++
  }
  emit('update:month', m)
  emit('update:year', y)
}

function handleSelect(day) {
  if (day.isFuture || day.isEmpty) return
  emit('selectDate', day.dateKey)
}
</script>

<template>
  <section class="calendar-section">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">‹</button>
      <h3>{{ monthYearLabel }}</h3>
      <button class="nav-btn" @click="nextMonth">›</button>
    </div>

    <div class="weekdays-grid">
      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
    </div>

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
        @click="handleSelect(day)"
      >
        <template v-if="!day.isEmpty">{{ day.dayNumber }}</template>
      </div>
    </div>
  </section>
</template>