import { dayjs, toIsoString } from './date'
import type { ScheduleOccurrence, ScheduleWidgetSettings } from './types'

export const REFRESH_DELAYS = {
  default: 10 * 60 * 1000,
  near: 30 * 1000,
  imminent: 10 * 1000,
} as const

export interface NotificationCheckpoint {
  key: string
  timestamp: string
  kind: 'alarm' | 'start' | 'end'
  occurrence: ScheduleOccurrence
}

export function buildNotificationCheckpoints(
  occurrences: ScheduleOccurrence[],
  settings: Pick<ScheduleWidgetSettings, 'notifyOnAlarm' | 'notifyOnStart' | 'notifyOnEnd'>,
) {
  const checkpoints: NotificationCheckpoint[] = []

  for (const occurrence of occurrences) {
    if (settings.notifyOnAlarm && typeof occurrence.alarmOffsetMinutes === 'number') {
      checkpoints.push({
        key: `${occurrence.occurrenceKey}:alarm`,
        timestamp: toIsoString(
          dayjs(occurrence.startAt)
            .subtract(occurrence.alarmOffsetMinutes, 'minute'),
        ),
        kind: 'alarm',
        occurrence,
      })
    }

    if (settings.notifyOnStart) {
      checkpoints.push({
        key: `${occurrence.occurrenceKey}:start`,
        timestamp: occurrence.startAt,
        kind: 'start',
        occurrence,
      })
    }

    if (settings.notifyOnEnd && occurrence.endAt) {
      checkpoints.push({
        key: `${occurrence.occurrenceKey}:end`,
        timestamp: occurrence.endAt,
        kind: 'end',
        occurrence,
      })
    }
  }

  return checkpoints.sort((left, right) =>
    dayjs(left.timestamp).valueOf() - dayjs(right.timestamp).valueOf(),
  )
}

export function getRecommendedRefreshDelay(
  checkpoints: Array<string | Date>,
  now: string,
  options?: {
    hasOngoing?: boolean
    keepActive?: boolean
  },
) {
  const current = dayjs(now)
  const shouldStayActive = Boolean(options?.hasOngoing || options?.keepActive)
  const nextDiffMs = checkpoints
    .map(item => dayjs(item).diff(current, 'millisecond'))
    .filter(value => value > 0)
    .sort((left, right) => left - right)[0]

  if (typeof nextDiffMs !== 'number') {
    return shouldStayActive ? REFRESH_DELAYS.near : REFRESH_DELAYS.default
  }

  if (nextDiffMs < 60 * 1000) {
    return REFRESH_DELAYS.imminent
  }

  if (shouldStayActive) {
    return REFRESH_DELAYS.near
  }

  if (nextDiffMs < 10 * 60 * 1000) {
    return REFRESH_DELAYS.near
  }

  return REFRESH_DELAYS.default
}
