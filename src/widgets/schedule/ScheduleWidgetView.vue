<script setup lang="ts">
import { useWidget } from '@widget-js/vue3'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ScheduleHeader from './components/ScheduleHeader.vue'
import ScheduleListView from './components/ScheduleListView.vue'
import { useScheduleNotifications } from './composables/useScheduleNotifications'
import { useScheduleStore } from './composables/useScheduleStore'
import { useScheduleView } from './composables/useScheduleView'
import { nowIsoString } from './model/date'
import { formatLongDateLabel } from './model/format'
import { formatOccurrenceTime, getCurrentAndNextOccurrence } from './model/occurrence'
import { getRecommendedRefreshDelay } from './model/refresh'

const { size } = useWidget({
  useBroadcastEvent: [],
})
const now = ref(nowIsoString())
let timer: number | undefined

const {
  sortedEvents,
  settings,
  notificationLog,
} = useScheduleStore()

const {
  todayActiveOccurrences,
  density,
} = useScheduleView(
  sortedEvents,
  settings,
  now,
  size.width,
  size.height,
)

const visibleTodayOccurrences = computed(() => todayActiveOccurrences.value ?? [])
const todaySummary = computed(() => getCurrentAndNextOccurrence(visibleTodayOccurrences.value))
const shouldKeepVisualsActive = computed(() =>
  settings.value.listBackgroundMode !== 'none'
  && visibleTodayOccurrences.value.length > 0,
)
const headerStatusText = computed(() => {
  if (todaySummary.value.current) {
    return `进行中 · ${todaySummary.value.current.title} · ${formatOccurrenceTime(todaySummary.value.current)}`
  }

  if (todaySummary.value.next) {
    return `接下来 · ${formatOccurrenceTime(todaySummary.value.next)} · ${todaySummary.value.next.title}`
  }

  return ''
})

const refreshCheckpoints = computed(() =>
  visibleTodayOccurrences.value.flatMap(occurrence => [
    occurrence.startAt,
    occurrence.endAt,
  ].filter(Boolean) as string[]),
)

useScheduleNotifications(sortedEvents, settings, notificationLog, now)

function scheduleTick() {
  now.value = nowIsoString()
  const delay = getRecommendedRefreshDelay(
    refreshCheckpoints.value,
    now.value,
    {
      hasOngoing: visibleTodayOccurrences.value.some(item => item.isOngoing),
      keepActive: shouldKeepVisualsActive.value,
    },
  )
  timer = window.setTimeout(scheduleTick, delay)
}

onMounted(() => {
  scheduleTick()
})

onUnmounted(() => {
  if (timer) {
    window.clearTimeout(timer)
  }
})
</script>

<template>
  <widget-wrapper>
    <section class="schedule-widget" :class="density">
      <ScheduleHeader
        :date-label="formatLongDateLabel(now)"
        :status-text="headerStatusText"
      />

      <main class="content">
        <ScheduleListView
          :occurrences="visibleTodayOccurrences"
          :now="now"
          :background-mode="settings.listBackgroundMode"
          :density="density"
        />
      </main>
    </section>
  </widget-wrapper>
</template>

<style scoped>
.schedule-widget {
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.56rem;
  box-sizing: border-box;
  padding: calc(var(--widget-padding, 12px) * 0.74) calc(var(--widget-padding, 12px) * 0.86) calc(var(--widget-padding, 12px) * 0.82);
  color: var(--widget-color);
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.content {
  min-height: 0;
  overflow: auto;
  padding-right: 0.18rem;
}

.compact .content {
  overflow: hidden;
}
</style>
