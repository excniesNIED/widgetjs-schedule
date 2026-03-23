<script setup lang="ts">
import { useWidget } from '@widget-js/vue3'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ScheduleHeader from './components/ScheduleHeader.vue'
import ScheduleListView from './components/ScheduleListView.vue'
import ScheduleWeekView from './components/ScheduleWeekView.vue'
import { useScheduleNotifications } from './composables/useScheduleNotifications'
import { useScheduleStore } from './composables/useScheduleStore'
import { useScheduleView } from './composables/useScheduleView'
import { formatLongDateLabel } from './model/format'
import { getViewToggleAction } from './model/presentation'
import type { ScheduleViewMode } from './model/types'

const { size } = useWidget({
  useBroadcastEvent: [],
})
const now = ref(new Date().toISOString())
let timer: number | undefined

const {
  sortedEvents,
  settings,
  notificationLog,
} = useScheduleStore()

const {
  todayOccurrences,
  weekDays,
  summary,
  density,
  getWeekOccurrencesForDay,
} = useScheduleView(
  sortedEvents,
  settings,
  now,
  size.width,
  size.height,
)

const activeView = ref<ScheduleViewMode>(settings.value.defaultView)

watch(
  () => settings.value.defaultView,
  (value) => {
    activeView.value = value
  },
)

const weekColumns = computed(() =>
  weekDays.value.map(day => ({
    date: day,
    occurrences: getWeekOccurrencesForDay(day),
  })),
)

const viewToggleAction = computed(() => getViewToggleAction(activeView.value))

function toggleView() {
  activeView.value = viewToggleAction.value.nextView
}

useScheduleNotifications(sortedEvents, settings, notificationLog, now)

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date().toISOString()
  }, 30_000)
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>

<template>
  <widget-wrapper>
    <section class="schedule-widget" :class="density">
      <ScheduleHeader
        :date-label="formatLongDateLabel(now)"
        :current="summary.current"
        :next="summary.next"
        :today-count="todayOccurrences.length"
        :toggle-label="viewToggleAction.label"
        :toggle-icon="viewToggleAction.icon"
        @toggle-view="toggleView"
      />

      <main class="content">
        <ScheduleListView
          v-if="activeView === 'list'"
          :occurrences="todayOccurrences"
          :now="now"
          :background-mode="settings.listBackgroundMode"
        />
        <ScheduleWeekView
          v-else
          :columns="weekColumns"
          :density="density"
          :now="now"
          :show-timeline="settings.showTimeline"
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
  gap: 0.72rem;
  color: var(--widget-color);
  user-select: none;
  -webkit-user-select: none;
}

.content {
  min-height: 0;
  overflow: auto;
  padding-right: 0.1rem;
}

.compact .content {
  overflow: hidden;
}
</style>
