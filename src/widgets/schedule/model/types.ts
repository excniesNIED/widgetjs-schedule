export type ScheduleSource = 'manual' | 'ics' | 'csv' | 'json'

export type ScheduleTimeMode = 'point' | 'range'

export type ScheduleRecurrenceType =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'workdays'
  | 'weekend'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'every_n_minutes'
  | 'every_n_hours'
  | 'every_n_days'
  | 'every_n_months'
  | 'every_n_years'
  | 'custom'

export type ScheduleViewMode = 'list' | 'week'
export type ScheduleWeekWindowMode = '3h' | '3events'
export type ScheduleListBackgroundMode = 'none' | 'countdown' | 'progress'

export interface ScheduleEventRecord {
  id: string
  uid?: string
  title: string
  description?: string
  teacher?: string
  sectionText?: string
  source: ScheduleSource
  timeMode: ScheduleTimeMode
  startAt: string
  endAt?: string
  timezone?: string
  allDay?: boolean
  alarmOffsetMinutes?: number
  recurrenceType: ScheduleRecurrenceType
  recurrenceInterval?: number
  recurrenceWeekdays?: number[]
  recurrenceWeeks?: string
  recurrenceWeekStart?: number
  recurrenceRRule?: string
  exdates?: string[]
  color?: string
  progressColor?: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleOccurrence {
  eventId: string
  occurrenceKey: string
  title: string
  description?: string
  teacher?: string
  sectionText?: string
  startAt: string
  endAt?: string
  timeMode: ScheduleTimeMode
  isOngoing: boolean
  isUpcoming: boolean
  isPast: boolean
  alarmOffsetMinutes?: number
  repeatLabel: string
  colorToken: string
  progressColorToken: string
  source: ScheduleSource
}

export type ScheduleNotificationType = 'toast' | 'system'

export interface ScheduleWidgetSettings {
  listBackgroundMode: ScheduleListBackgroundMode
  showTimeline: boolean
  notifyOnAlarm: boolean
  notifyOnStart: boolean
  notifyOnEnd: boolean
  notificationTypes: ScheduleNotificationType[]
  toastDuration: number
}

export interface ExpandEventsRangeInput {
  events: ScheduleEventRecord[]
  rangeStart: string
  rangeEnd: string
  now: string
}

export interface ScheduleSummary {
  current?: ScheduleOccurrence
  next?: ScheduleOccurrence
}

export interface ScheduleImportError {
  row?: number
  message: string
}

export interface ScheduleImportResult {
  events: ScheduleEventRecord[]
  errors: ScheduleImportError[]
}
