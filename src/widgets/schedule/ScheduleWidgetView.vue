<script setup lang="ts">
import { useWidget, WidgetWrapper } from '@widget-js/vue3'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ScheduleListView from './components/ScheduleListView.vue'
import { useScheduleNotifications } from './composables/useScheduleNotifications'
import { useScheduleStore } from './composables/useScheduleStore'
import { useScheduleView } from './composables/useScheduleView'
import { nowIsoString } from './model/date'
import { formatLongDateLabel } from './model/format'
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
const shouldKeepVisualsActive = computed(() =>
  settings.value.listBackgroundMode !== 'none'
  && todayActiveOccurrences.value.some(item => item.isOngoing),
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
  <WidgetWrapper>
    <div class="widget-shell">
      <section class="schedule-widget" :class="density">
        <header class="schedule-header">
          <h1 class="date-title">
            {{ formatLongDateLabel(now) }}
          </h1>
        </header>
        <main class="schedule-content">
          <div class="list-container">
            <ScheduleListView
              :occurrences="visibleTodayOccurrences"
              :now="now"
              :background-mode="settings.listBackgroundMode"
              :density="density"
              :point-event-duration-minutes="settings.pointEventDurationMinutes"
            />
          </div>
        </main>
      </section>
    </div>
  </WidgetWrapper>
</template>

<style scoped>
/* ====== 唯一裁切边界 ====== */
.widget-shell {
  --schedule-shell-radius: 32px;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  box-sizing: border-box;
  border-radius: var(--schedule-shell-radius);
  overflow: hidden;
  isolation: isolate;
}

/* ====== 布局容器（无 overflow，不阻断滚动链） ====== */
.schedule-widget {
  --space-8: 8px;
  --space-12: 12px;
  --space-16: 16px;
  --space-18: 18px;
  --bg-surface: color-mix(in srgb, var(--widget-background-color) 14%, transparent);
  --bg-card: color-mix(in srgb, var(--widget-background-color) 30%, transparent);
  --bg-card-active: color-mix(in srgb, var(--widget-background-color) 36%, transparent);
  --bg-progress: color-mix(in srgb, #74d7a7 36%, transparent);
  --bg-countdown: color-mix(in srgb, #ffd36e 34%, transparent);
  --text-primary: var(--widget-color);
  --text-secondary: color-mix(in srgb, var(--widget-color) 82%, transparent);
  --schedule-card-radius: 12px;
  --schedule-card-height: 48px;
  --schedule-card-padding-x: 14px;
  --schedule-card-padding-y: 8px;
  --schedule-card-stack-gap: 2px;
  --schedule-list-gap: 6px;
  --schedule-list-gap-compact: 6px;
  --schedule-list-gap-large: 6px;
  --schedule-header-offset-x: 8px;
  --schedule-header-title-size: 0.825rem;
  --schedule-card-title-size: 0.75rem;
  --schedule-meta-size: 0.5625rem;
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  box-sizing: border-box;
  padding: var(--space-18) var(--space-18) 20px;
  border-radius: var(--schedule-shell-radius);
  color: var(--text-primary);
  user-select: none;
  -webkit-user-select: none;
}

/* ====== 标题区（固定高度，不参与 flex 缩放） ====== */
.schedule-header {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  padding-inline-start: var(--schedule-header-offset-x);
}

.date-title {
  margin: 0;
  font-size: var(--schedule-header-title-size);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ====== 内容区（弹性填充，无 overflow） ====== */
.schedule-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

/* ====== 滚动区域 ====== */
.list-container {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 210px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 0 28px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.list-container::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.compact {
  --schedule-header-offset-x: 8px;
}

.large {
  --schedule-header-offset-x: 8px;
}
</style>
