import { nowIsoString } from './date'
import type {
  ScheduleEventRecord,
  ScheduleWidgetSettings,
} from './types'

export const SCHEDULE_STORAGE_KEYS = {
  events: 'schedule.events',
  settings: 'schedule.settings',
  importMeta: 'schedule.import.meta',
  notificationLog: 'schedule.notification.log',
} as const

function createScheduleId(prefix = 'schedule') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function buildDefaultEvent(
  partial: Partial<ScheduleEventRecord> = {},
): ScheduleEventRecord {
  const now = nowIsoString()

  return {
    ...partial,
    id: partial.id?.trim() || createScheduleId('event'),
    title: partial.title ?? '',
    source: partial.source ?? 'manual',
    timeMode: partial.timeMode ?? 'point',
    startAt: partial.startAt ?? now,
    recurrenceType: partial.recurrenceType ?? 'none',
    recurrenceInterval: partial.recurrenceInterval ?? 1,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  }
}

export function buildDefaultSettings(): ScheduleWidgetSettings {
  return {
    listBackgroundMode: 'progress',
    showTimeline: true,
    notifyOnAlarm: true,
    notifyOnStart: true,
    notifyOnEnd: false,
    notificationTypes: ['toast', 'system'],
    toastDuration: 5000,
    pointEventDurationMinutes: 5,
  }
}
