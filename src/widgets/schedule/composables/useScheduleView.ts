import { computed, type Ref } from 'vue'
import { dayjs } from '../model/date'
import {
  expandEventsInRange,
} from '../model/occurrence'
import { groupOccurrencesByDate } from '../model/format'
import type {
  ScheduleEventRecord,
  ScheduleWidgetSettings,
} from '../model/types'

function buildWeekDays(now: string) {
  const start = dayjs(now).startOf('isoWeek')
  return Array.from({ length: 7 }, (_, index) => start.add(index, 'day').toISOString())
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
    todayOccurrences.value.filter(occurrence => !occurrence.isPast),
  )
  const weekDays = computed(() => buildWeekDays(now.value))
  const groupedWeekOccurrences = computed(() =>
    groupOccurrencesByDate(weekOccurrences.value),
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
    const key = day.slice(0, 10)
    const occurrences = groupedWeekOccurrences.value[key] ?? []

    if (settings.value.weekWindowMode === '3events') {
      return occurrences.slice(0, density.value === 'compact' ? 2 : 3)
    }

    const windowStart = dayjs(now.value)
    const windowEnd = windowStart.add(3, 'hour')
    const filtered = occurrences.filter((occurrence) => {
      const start = dayjs(occurrence.startAt)
      return occurrence.isOngoing || (start.isAfter(windowStart) && start.isBefore(windowEnd))
    })

    if (filtered.length > 0) {
      return filtered.slice(0, density.value === 'compact' ? 2 : 3)
    }

    return occurrences.slice(0, density.value === 'compact' ? 2 : 3)
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
