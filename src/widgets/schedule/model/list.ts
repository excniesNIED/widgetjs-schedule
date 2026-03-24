import { dayjs } from './date'
import type {
  ScheduleListBackgroundMode,
  ScheduleOccurrence,
} from './types'

const POINT_EVENT_DURATION_MINUTES = 30

function getOccurrenceEndAt(occurrence: ScheduleOccurrence) {
  if (occurrence.endAt) {
    return dayjs(occurrence.endAt)
  }

  return dayjs(occurrence.startAt).add(POINT_EVENT_DURATION_MINUTES, 'minute')
}

function clampRatio(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

export function formatRemainingTime(endAt: string, now: string) {
  const diffMinutes = Math.max(dayjs(endAt).diff(dayjs(now), 'minute'), 0)

  if (diffMinutes < 60) {
    return `剩余 ${diffMinutes} 分钟`
  }

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  if (minutes === 0) {
    return `剩余 ${hours} 小时`
  }

  return `剩余 ${hours} 小时 ${minutes} 分钟`
}

export function getOccurrenceFillRatio(
  occurrence: ScheduleOccurrence,
  now: string,
  backgroundMode: ScheduleListBackgroundMode,
) {
  if (backgroundMode === 'none' || !occurrence.isOngoing) {
    return 0
  }

  const start = dayjs(occurrence.startAt)
  const end = getOccurrenceEndAt(occurrence)
  const current = dayjs(now)
  const total = Math.max(end.diff(start, 'millisecond'), 1)
  const elapsed = Math.max(current.diff(start, 'millisecond'), 0)

  if (backgroundMode === 'progress') {
    return clampRatio(elapsed / total)
  }

  if (backgroundMode === 'countdown') {
    const remaining = Math.max(end.diff(current, 'millisecond'), 0)
    return clampRatio(remaining / total)
  }

  return 0
}

export function getOccurrenceStatusText(
  occurrence: ScheduleOccurrence,
  now: string,
  backgroundMode: ScheduleListBackgroundMode,
) {
  if (occurrence.isOngoing) {
    if (backgroundMode === 'countdown') {
      return formatRemainingTime(getOccurrenceEndAt(occurrence).format(), now)
    }

    return '正在进行'
  }

  if (occurrence.isUpcoming) {
    return '即将进行'
  }

  return '已结束'
}
