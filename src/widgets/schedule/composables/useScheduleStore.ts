import { useStorage } from '@vueuse/core'
import { computed } from 'vue'
import { buildDefaultSettings, SCHEDULE_STORAGE_KEYS } from '../model/defaults'
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
    const normalized = importedEvents.map(event => normalizeEventRecord(event, event.source))
    const existing = new Map(events.value.map(event => [event.id, event]))
    for (const event of normalized) {
      existing.set(event.id, event)
    }
    events.value = Array.from(existing.values())
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
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
    [...events.value].sort((left, right) => left.startAt.localeCompare(right.startAt)),
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
