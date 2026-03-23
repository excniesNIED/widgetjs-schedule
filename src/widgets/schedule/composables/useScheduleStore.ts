import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { dayjs } from '../model/date'
import { buildDefaultSettings, SCHEDULE_STORAGE_KEYS } from '../model/defaults'
import { mergeImportedEvents } from '../model/import'
import { normalizeEventRecord } from '../model/normalize'
import type {
  ScheduleEventRecord,
  ScheduleWidgetSettings,
} from '../model/types'

type NotificationLog = Record<string, true>

export function useScheduleStore() {
  const events = useStorage<ScheduleEventRecord[]>(
    SCHEDULE_STORAGE_KEYS.events,
    [],
  )
  const settings = useStorage<ScheduleWidgetSettings>(
    SCHEDULE_STORAGE_KEYS.settings,
    buildDefaultSettings(),
  )
  const notificationLog = useStorage<NotificationLog>(
    SCHEDULE_STORAGE_KEYS.notificationLog,
    {},
  )

  function upsertEvent(event: Partial<ScheduleEventRecord>) {
    const normalized = normalizeEventRecord(event, event.source ?? 'manual')
    const index = events.value.findIndex(item => item.id === normalized.id)
    if (index >= 0) {
      events.value[index] = normalized
    }
    else {
      events.value.unshift(normalized)
    }
  }

  function removeEvent(id: string) {
    events.value = events.value.filter(item => item.id !== id)
  }

  function importEvents(importedEvents: ScheduleEventRecord[]) {
    events.value = mergeImportedEvents(events.value, importedEvents)
  }

  function clearAll() {
    events.value = []
    notificationLog.value = {}
  }

  function updateSettings(patch: Partial<ScheduleWidgetSettings>) {
    settings.value = {
      ...settings.value,
      ...patch,
    }
  }

  const sortedEvents = computed(() =>
    [...events.value].sort((left, right) => dayjs(left.startAt).valueOf() - dayjs(right.startAt).valueOf()),
  )

  return {
    events,
    sortedEvents,
    settings,
    notificationLog,
    upsertEvent,
    removeEvent,
    importEvents,
    clearAll,
    updateSettings,
  }
}
