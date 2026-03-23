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

const LIGHT_SCHEDULE_COLORS = {
  card: '#eadfc8',
  text: '#17313e',
  progress: '#d78842',
  ongoing: '#ce6a4b',
  upcoming: '#4b7a87',
} as const

const DARK_SCHEDULE_COLORS = {
  card: '#55646b',
  text: '#f3f6f7',
  progress: '#8fc7ff',
  ongoing: '#ff9a7a',
  upcoming: '#7bc6d6',
} as const

function prefersDarkMode() {
  return Boolean(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches)
}

export function getDefaultScheduleColors() {
  return prefersDarkMode() ? DARK_SCHEDULE_COLORS : LIGHT_SCHEDULE_COLORS
}

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
  const defaults = getDefaultScheduleColors()

  return {
    id: createScheduleId('event'),
    title: '',
    source: 'manual',
    timeMode: 'point',
    startAt: now,
    recurrenceType: 'none',
    recurrenceInterval: 1,
    createdAt: now,
    updatedAt: now,
    color: defaults.card,
    progressColor: defaults.progress,
    ...partial,
  }
}

export function buildDefaultSettings(): ScheduleWidgetSettings {
  const defaults = getDefaultScheduleColors()
  return {
    defaultView: 'list',
    weekWindowMode: '3events',
    listBackgroundMode: 'progress',
    showTimeline: true,
    notifyOnAlarm: true,
    notifyOnStart: true,
    notifyOnEnd: false,
    cardColor: defaults.card,
    textColor: defaults.text,
    progressColor: defaults.progress,
    ongoingColor: defaults.ongoing,
    upcomingColor: defaults.upcoming,
  }
}
