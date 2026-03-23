<script setup lang="ts">
import { DeployMode } from '@widget-js/core'
import { useWidget, WidgetBackground } from '@widget-js/vue3'
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

const { size, widgetParams } = useWidget({
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
const wrapperComponent = computed(() =>
  widgetParams.mode === DeployMode.OVERLAP ? 'OverlapWidgetWrapper' : 'DesktopWidgetWrapper',
)

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
  <component :is="wrapperComponent">
    <div class="widget-shell">
      <WidgetBackground class="background-layer" />
      <section class="schedule-widget" :class="density">
        <div class="content-panel">
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
        </div>
      </section>
    </div>
  </component>
</template>

<style scoped>
.widget-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
}

.background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.schedule-widget {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: stretch;
  box-sizing: border-box;
  padding: 16px;
  color: var(--widget-color);
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.content-panel {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 16px;
  background: color-mix(in srgb, var(--widget-background-color) 92%, rgba(255,255,255,0.06));
  border: 1px solid color-mix(in srgb, var(--widget-color) 10%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 6%, transparent);
  overflow: hidden;
}

.content {
  min-height: 0;
  width: 100%;
  overflow: auto;
  overflow-x: hidden;
  padding-right: 0;
  box-sizing: border-box;
}

.compact .content-panel {
  padding: 8px;
  gap: 8px;
}

.large .content-panel {
  padding: 24px;
}
</style>
