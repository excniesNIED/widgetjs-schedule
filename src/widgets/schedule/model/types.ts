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
  location?: string
  source: ScheduleSource
  timeMode: ScheduleTimeMode
  startAt: string
  endAt?: string
  timezone?: string
  allDay?: boolean
  recurrenceType: ScheduleRecurrenceType
  recurrenceInterval?: number
  recurrenceWeekdays?: number[]
  recurrenceWeeks?: string
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
  location?: string
  startAt: string
  endAt?: string
  timeMode: ScheduleTimeMode
  isOngoing: boolean
  isUpcoming: boolean
  isPast: boolean
  repeatLabel: string
  colorToken: string
  progressColorToken: string
  source: ScheduleSource
}

export interface ScheduleWidgetSettings {
  defaultView: ScheduleViewMode
  weekWindowMode: ScheduleWeekWindowMode
  listBackgroundMode: ScheduleListBackgroundMode
  showTimeline: boolean
  cardColor: string
  textColor: string
  progressColor: string
  ongoingColor: string
  upcomingColor: string
}

export interface ExpandEventsRangeInput {
  events: ScheduleEventRecord[]
  rangeStart: string
  rangeEnd: string
  now: string
  settings: ScheduleWidgetSettings
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
