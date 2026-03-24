import { computed, type Ref } from 'vue'
import { dayjs, toIsoString } from '../model/date'
import {
  expandEventsInRange,
} from '../model/occurrence'
import type {
  ScheduleEventRecord,
  ScheduleWidgetSettings,
} from '../model/types'

export function useScheduleView(
  events: Ref<ScheduleEventRecord[]>,
  settings: Ref<ScheduleWidgetSettings>,
  now: Ref<string>,
  widgetWidth: Ref<number>,
  widgetHeight: Ref<number>,
) {
  const todayRange = computed(() => ({
    start: toIsoString(dayjs(now.value).startOf('day')),
    end: toIsoString(dayjs(now.value).endOf('day')),
  }))

  const todayOccurrences = computed(() =>
    expandEventsInRange({
      events: events.value,
      rangeStart: todayRange.value.start,
      rangeEnd: todayRange.value.end,
      now: now.value,
    }),
  )

  const todayActiveOccurrences = computed(() =>
    (todayOccurrences.value ?? []).filter(occurrence => !occurrence.isPast),
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
  return {
    todayOccurrences,
    todayActiveOccurrences,
    density,
  }
}
