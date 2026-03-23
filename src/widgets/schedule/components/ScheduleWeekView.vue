<script setup lang="ts">
import { computed } from 'vue'
import type { Dayjs } from 'dayjs'
import { dayjs, toLocalDate, toLocalTime } from '../model/date'
import { getReadableTextColor } from '../model/color'
import { formatOccurrenceTime, formatShortDateLabel, formatWeekdayLabel } from '../model/format'
import type { ScheduleOccurrence } from '../model/types'
import ScheduleEmptyState from './ScheduleEmptyState.vue'

interface WeekColumn {
  date: string
  occurrences: ScheduleOccurrence[]
}

interface TimelineMarker {
  key: string
  label: string
  top: number
}

const HALF_HOUR_MINUTES = 30
const MIN_WINDOW_MINUTES = 180

const props = withDefaults(defineProps<{
  columns: WeekColumn[]
  density: 'compact' | 'standard' | 'large'
  now: string
  showTimeline: boolean
}>(), {
  columns: () => [],
  density: 'standard',
})

function getOccurrenceEnd(occurrence: ScheduleOccurrence) {
  return occurrence.endAt
    ? dayjs(occurrence.endAt)
    : dayjs(occurrence.startAt).add(HALF_HOUR_MINUTES, 'minute')
}

function alignMinutes(value: Dayjs, direction: 'start' | 'end') {
  const minute = value.minute()
  const remainder = minute % HALF_HOUR_MINUTES

  if (remainder === 0 && value.second() === 0 && value.millisecond() === 0) {
    return value.second(0).millisecond(0)
  }

  if (direction === 'start') {
    return value
      .subtract(remainder, 'minute')
      .second(0)
      .millisecond(0)
  }

  return value
    .add(HALF_HOUR_MINUTES - remainder, 'minute')
    .second(0)
    .millisecond(0)
}

const allOccurrences = computed(() =>
  props.columns.flatMap(column => column.occurrences),
)

const timelineWindow = computed(() => {
  const occurrences = allOccurrences.value
  const current = dayjs(props.now)

  if (occurrences.length === 0) {
    const start = alignMinutes(current.startOf('hour'), 'start')
    const end = start.add(MIN_WINDOW_MINUTES, 'minute')
    return {
      start,
      end,
      totalMinutes: MIN_WINDOW_MINUTES,
    }
  }

  let start = occurrences
    .map(occurrence => dayjs(occurrence.startAt))
    .sort((left, right) => left.valueOf() - right.valueOf())[0]!
  const endCandidates = occurrences
    .map(occurrence => getOccurrenceEnd(occurrence))
    .sort((left, right) => left.valueOf() - right.valueOf())
  let end = endCandidates[endCandidates.length - 1]!

  if (props.showTimeline) {
    if (current.isBefore(start)) {
      start = current
    }
    if (current.isAfter(end)) {
      end = current
    }
  }

  const visibleMinutes = end.diff(start, 'minute')
  if (visibleMinutes < MIN_WINDOW_MINUTES) {
    const padding = MIN_WINDOW_MINUTES - visibleMinutes
    start = start.subtract(Math.floor(padding / 2), 'minute')
    end = end.add(Math.ceil(padding / 2), 'minute')
  }

  start = alignMinutes(start, 'start')
  end = alignMinutes(end, 'end')

  return {
    start,
    end,
    totalMinutes: Math.max(end.diff(start, 'minute'), MIN_WINDOW_MINUTES),
  }
})

const totalCount = computed(() => allOccurrences.value.length)

const timelineMarkers = computed<TimelineMarker[]>(() => {
  const markers: TimelineMarker[] = []
  const { start, end, totalMinutes } = timelineWindow.value

  let cursor = start
  while (cursor.isBefore(end) || cursor.isSame(end)) {
    markers.push({
      key: cursor.toISOString(),
      label: cursor.format('HH:mm'),
      top: Math.min(Math.max((cursor.diff(start, 'minute') / totalMinutes) * 100, 0), 100),
    })
    cursor = cursor.add(1, 'hour')
  }

  return markers
})

function getCardStyle(occurrence: ScheduleOccurrence) {
  const { start, totalMinutes } = timelineWindow.value
  const occurrenceStart = dayjs(occurrence.startAt)
  const occurrenceEnd = getOccurrenceEnd(occurrence)
  const top = Math.min(Math.max((occurrenceStart.diff(start, 'minute') / totalMinutes) * 100, 0), 100)
  const height = Math.max((occurrenceEnd.diff(occurrenceStart, 'minute') / totalMinutes) * 100, 8)
  const minimumHeight = props.density === 'large' ? '4.8rem' : props.density === 'compact' ? '3.2rem' : '4rem'

  return {
    top: `${top}%`,
    height: `max(${height}%, ${minimumHeight})`,
    background: `linear-gradient(135deg, ${occurrence.colorToken}, rgba(255,255,255,0.86))`,
    '--week-card-text': getReadableTextColor(occurrence.colorToken),
  }
}

function getCurrentLineStyle(columnDate: string) {
  if (!props.showTimeline || toLocalDate(columnDate) !== toLocalDate(props.now)) {
    return undefined
  }

  const { start, end, totalMinutes } = timelineWindow.value
  const current = dayjs(props.now)
  if (current.isBefore(start) || current.isAfter(end)) {
    return undefined
  }

  return {
    top: `${(current.diff(start, 'minute') / totalMinutes) * 100}%`,
  }
}

function getProgressWidth(occurrence: ScheduleOccurrence) {
  if (!occurrence.isOngoing || !occurrence.endAt) {
    return '0%'
  }

  const start = dayjs(occurrence.startAt)
  const end = dayjs(occurrence.endAt)
  const current = dayjs(props.now)
  const total = Math.max(end.diff(start, 'millisecond'), 1)
  const elapsed = Math.max(current.diff(start, 'millisecond'), 0)
  return `${Math.min(Math.max((elapsed / total) * 100, 0), 100)}%`
}
</script>

<template>
  <div v-if="totalCount > 0" class="week-layout" :class="density">
    <aside class="time-rail">
      <div class="rail-head" />
      <div class="rail-body">
        <div
          v-for="marker in timelineMarkers"
          :key="marker.key"
          class="time-marker"
          :style="{ top: `${marker.top}%` }"
        >
          <span>{{ marker.label }}</span>
        </div>
      </div>
    </aside>

    <section
      v-for="column in columns"
      :key="column.date"
      class="day-column"
    >
      <header class="day-head">
        <strong>{{ formatWeekdayLabel(column.date) }}</strong>
        <span>{{ formatShortDateLabel(column.date) }}</span>
      </header>

      <div class="day-body">
        <div
          v-for="marker in timelineMarkers"
          :key="`${column.date}-${marker.key}`"
          class="grid-line"
          :style="{ top: `${marker.top}%` }"
        />

        <div
          v-if="getCurrentLineStyle(column.date)"
          class="current-line"
          :style="getCurrentLineStyle(column.date)"
        >
          <span>{{ toLocalTime(now) }}</span>
        </div>

        <article
          v-for="occurrence in column.occurrences"
          :key="occurrence.occurrenceKey"
          class="card"
          :class="{ ongoing: occurrence.isOngoing, upcoming: occurrence.isUpcoming }"
          :style="getCardStyle(occurrence)"
        >
          <strong>{{ occurrence.title }}</strong>
          <span>{{ formatOccurrenceTime(occurrence) }}</span>
          <div v-if="occurrence.isOngoing" class="card-progress">
            <span :style="{ width: getProgressWidth(occurrence), background: occurrence.progressColorToken }" />
          </div>
        </article>

        <div v-if="column.occurrences.length === 0" class="empty-day">
          无日程
        </div>
      </div>
    </section>
  </div>
  <ScheduleEmptyState
    v-else
    title="本周暂无日程"
    description="去添加或导入日程。"
  />
</template>

<style scoped>
.week-layout {
  --week-body-height: max(11.5rem, calc(var(--widget-inner-height, 320px) - 4.8rem));
  display: grid;
  grid-template-columns: 2.2rem repeat(7, minmax(0, 1fr));
  gap: 0.42rem;
}

.time-rail,
.day-column {
  display: grid;
  grid-template-rows: auto var(--week-body-height);
  gap: 0.32rem;
  min-width: 0;
}

.rail-head,
.day-head {
  display: grid;
  align-content: end;
  min-height: 2.6rem;
}

.day-head {
  justify-items: center;
  gap: 0.08rem;
}

.day-head strong {
  font-size: 0.8rem;
  color: var(--widget-color);
  line-height: 1.1;
}

.day-head span {
  font-size: 0.68rem;
  color: color-mix(in srgb, var(--widget-color) 70%, transparent);
}

.rail-body,
.day-body {
  position: relative;
  height: var(--week-body-height);
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--widget-color) 10%, transparent);
  background: color-mix(in srgb, var(--widget-background-color) 94%, white);
  overflow: hidden;
}

.time-marker,
.grid-line {
  position: absolute;
  inset-inline: 0;
}

.time-marker {
  transform: translateY(-50%);
}

.time-marker span {
  position: absolute;
  right: 0.35rem;
  transform: translateY(-50%);
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--widget-color) 62%, transparent);
}

.grid-line {
  height: 1px;
  background: color-mix(in srgb, var(--widget-color) 9%, transparent);
}

.current-line {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
  height: 1px;
  background: var(--widget-primary-color, #ef4444);
}

.current-line span {
  position: absolute;
  right: 0.2rem;
  top: -0.68rem;
  padding: 0 0.2rem;
  font-size: 0.62rem;
  line-height: 1.1;
  color: var(--widget-primary-color, #ef4444);
  background: color-mix(in srgb, var(--widget-background-color) 92%, white);
}

.card {
  position: absolute;
  left: 0.12rem;
  right: 0.12rem;
  z-index: 3;
  display: grid;
  gap: 0.12rem;
  padding: 0.34rem 0.28rem;
  border-radius: 0.7rem;
  border: 1px solid color-mix(in srgb, var(--widget-color) 10%, transparent);
  align-content: start;
  box-sizing: border-box;
}

.card strong {
  font-size: 0.72rem;
  line-height: 1.15;
  color: var(--week-card-text);
  word-break: break-word;
}

.card span {
  font-size: 0.6rem;
  line-height: 1.2;
  color: color-mix(in srgb, var(--week-card-text) 74%, transparent);
}

.card.ongoing {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--widget-primary-color, #ef4444) 20%, transparent);
}

.card.upcoming {
  box-shadow: 0 0 0 1px color-mix(in srgb, #2563eb 20%, transparent);
}

.empty-day {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--widget-color) 56%, transparent);
}

.card-progress {
  overflow: hidden;
  height: 0.18rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--week-card-text) 14%, transparent);
}

.card-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.compact {
  --week-body-height: max(9.5rem, calc(var(--widget-inner-height, 220px) - 4.4rem));
}

.compact .week-layout,
.week-layout.compact {
  grid-template-columns: 2rem repeat(7, minmax(0, 1fr));
}

.compact .day-head strong {
  font-size: 0.72rem;
}

.compact .day-head span,
.compact .time-marker span {
  font-size: 0.62rem;
}

.compact .card {
  padding: 0.28rem 0.22rem;
}

.compact .card strong {
  font-size: 0.66rem;
}

.compact .card span {
  font-size: 0.56rem;
}

.large {
  --week-body-height: max(14rem, calc(var(--widget-inner-height, 440px) - 5rem));
}

.large .day-head strong {
  font-size: 0.86rem;
}

.large .day-head span,
.large .time-marker span {
  font-size: 0.66rem;
}

.large .card {
  padding: 0.38rem 0.32rem;
}

.large .card strong {
  font-size: 0.78rem;
}

.large .card span {
  font-size: 0.64rem;
}
</style>
