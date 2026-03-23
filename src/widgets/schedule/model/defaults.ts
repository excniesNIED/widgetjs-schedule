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

export const DEFAULT_SCHEDULE_COLORS = {
  card: '#eadfc8',
  text: '#17313e',
  progress: '#d78842',
  ongoing: '#ce6a4b',
  upcoming: '#4b7a87',
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
  const now = new Date().toISOString()

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
    color: DEFAULT_SCHEDULE_COLORS.card,
    progressColor: DEFAULT_SCHEDULE_COLORS.progress,
    ...partial,
  }
}

export function buildDefaultSettings(): ScheduleWidgetSettings {
  return {
    defaultView: 'list',
    weekWindowMode: '3events',
    listBackgroundMode: 'progress',
    showTimeline: true,
    notifyOnAlarm: true,
    notifyOnStart: true,
    notifyOnEnd: false,
    cardColor: DEFAULT_SCHEDULE_COLORS.card,
    textColor: DEFAULT_SCHEDULE_COLORS.text,
    progressColor: DEFAULT_SCHEDULE_COLORS.progress,
    ongoingColor: DEFAULT_SCHEDULE_COLORS.ongoing,
    upcomingColor: DEFAULT_SCHEDULE_COLORS.upcoming,
  }
}
