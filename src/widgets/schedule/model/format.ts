import { dayjs, toLocalDate, toLocalTime } from './date'
import type {
  ScheduleEventRecord,
  ScheduleOccurrence,
} from './types'

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export function formatOccurrenceTime(occurrence: Pick<ScheduleOccurrence, 'startAt' | 'endAt' | 'timeMode'>) {
  if (occurrence.timeMode === 'point' || !occurrence.endAt) {
    return toLocalTime(occurrence.startAt)
  }

  return `${toLocalTime(occurrence.startAt)} - ${toLocalTime(occurrence.endAt)}`
}

export function formatShortDateLabel(value: string) {
  return dayjs(value).format('M月D日')
}

export function formatLongDateLabel(value: string) {
  return dayjs(value).format('YYYY年M月D日')
}

export function formatWeekdayLabel(value: string) {
  return WEEKDAY_LABELS[dayjs(value).isoWeekday() - 1] ?? ''
}

export function formatRelativeCountdown(startAt: string, now: string) {
  const diffMinutes = dayjs(startAt).diff(dayjs(now), 'minute')
  if (diffMinutes <= 0) {
    return '进行中'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟后`
  }

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  return minutes > 0 ? `${hours} 小时 ${minutes} 分钟后` : `${hours} 小时后`
}

export function buildEventDateKey(value: string) {
  return toLocalDate(value)
}

export function groupOccurrencesByDate(occurrences: ScheduleOccurrence[]) {
  return occurrences.reduce<Record<string, ScheduleOccurrence[]>>((groups, occurrence) => {
    const key = buildEventDateKey(occurrence.startAt)
    groups[key] ??= []
    groups[key].push(occurrence)
    return groups
  }, {})
}

export function getRepeatLabel(event: ScheduleEventRecord) {
  const interval = event.recurrenceInterval && event.recurrenceInterval > 0
    ? event.recurrenceInterval
    : 1
  const suffix = event.recurrenceWeeks ? ` · ${event.recurrenceWeeks}周` : ''

  switch (event.recurrenceType) {
    case 'none':
      return '单次'
    case 'daily':
      return `每天${suffix}`
    case 'weekdays':
    case 'workdays':
      return `工作日${suffix}`
    case 'weekend':
      return `周末${suffix}`
    case 'weekly':
      return `每周${suffix}`
    case 'monthly':
      return `每月${suffix}`
    case 'yearly':
      return `每年${suffix}`
    case 'every_n_minutes':
      return `每 ${interval} 分钟${suffix}`
    case 'every_n_hours':
      return `每 ${interval} 小时${suffix}`
    case 'every_n_days':
      return `每 ${interval} 天${suffix}`
    case 'every_n_months':
      return `每 ${interval} 月${suffix}`
    case 'every_n_years':
      return `每 ${interval} 年${suffix}`
    case 'custom':
      return `自定义${suffix}`
    default:
      return '单次'
  }
}
