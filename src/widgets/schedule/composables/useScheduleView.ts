import { computed, type Ref } from 'vue'
import { dayjs, toLocalDate } from '../model/date'
import {
  expandEventsInRange,
} from '../model/occurrence'
import { groupOccurrencesByDate } from '../model/format'
import type {
  ScheduleEventRecord,
  ScheduleOccurrence,
  ScheduleWidgetSettings,
} from '../model/types'

function buildWeekDays(now: string) {
  const start = dayjs(now).startOf('isoWeek')
  return Array.from({ length: 7 }, (_, index) => start.add(index, 'day').toISOString())
}

function getWindowedOccurrences(
  day: string,
  occurrences: ScheduleOccurrence[],
  now: string,
  limit: number,
) {
  if (occurrences.length === 0) {
    return []
  }

  const isCurrentDay = toLocalDate(day) === toLocalDate(now)
  const base = isCurrentDay
    ? dayjs(now)
    : dayjs(occurrences[0]?.startAt ?? day)
  const windowEnd = base.add(3, 'hour')
  const filtered = occurrences.filter((occurrence) => {
    const start = dayjs(occurrence.startAt)
    const end = occurrence.endAt ? dayjs(occurrence.endAt) : start
    return occurrence.isOngoing || end.isAfter(base) && start.isBefore(windowEnd)
  })

  if (filtered.length > 0) {
    return filtered.slice(0, limit)
  }

  return occurrences.slice(0, limit)
}

export function useScheduleView(
  events: Ref<ScheduleEventRecord[]>,
  settings: Ref<ScheduleWidgetSettings>,
  now: Ref<string>,
  widgetWidth: Ref<number>,
  widgetHeight: Ref<number>,
) {
  const todayRange = computed(() => ({
    start: dayjs(now.value).startOf('day').toISOString(),
    end: dayjs(now.value).endOf('day').toISOString(),
  }))
  const weekRange = computed(() => ({
    start: dayjs(now.value).startOf('isoWeek').toISOString(),
    end: dayjs(now.value).endOf('isoWeek').toISOString(),
  }))

  const todayOccurrences = computed(() =>
    expandEventsInRange({
      events: events.value,
      rangeStart: todayRange.value.start,
      rangeEnd: todayRange.value.end,
      now: now.value,
      settings: settings.value,
    }),
  )

  const weekOccurrences = computed(() =>
    expandEventsInRange({
      events: events.value,
      rangeStart: weekRange.value.start,
      rangeEnd: weekRange.value.end,
      now: now.value,
      settings: settings.value,
    }),
  )

  const todayActiveOccurrences = computed(() =>
    (todayOccurrences.value ?? []).filter(occurrence => !occurrence.isPast),
  )
  const weekDays = computed(() => buildWeekDays(now.value))
  const groupedWeekOccurrences = computed(() =>
    groupOccurrencesByDate(weekOccurrences.value ?? []),
  )

  const density = computed<'compact' | 'standard' | 'large'>(() => {
    if (widgetWidth.value >= 8 || widgetHeight.value >= 8) {
      return 'large'
    }

    if (widgetHeight.value <= 3) {
      return 'compact'
    }

    return 'standard'
  })

  function getWeekOccurrencesForDay(day: string) {
    const key = toLocalDate(day)
    const occurrences = groupedWeekOccurrences.value[key] ?? []
    const limit = density.value === 'compact' ? 2 : 3

    if (settings.value.weekWindowMode === '3events') {
      return occurrences.slice(0, limit)
    }

    return getWindowedOccurrences(day, occurrences, now.value, limit)
  }

  return {
    todayOccurrences,
    todayActiveOccurrences,
    weekOccurrences,
    weekDays,
    density,
    getWeekOccurrencesForDay,
  }
}
