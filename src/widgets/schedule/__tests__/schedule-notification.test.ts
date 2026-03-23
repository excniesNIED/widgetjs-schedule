import { describe, expect, it } from 'vitest'
import { buildNotificationCheckpoints, getRecommendedRefreshDelay, REFRESH_DELAYS } from '../model/refresh'
import type { ScheduleOccurrence, ScheduleWidgetSettings } from '../model/types'

function buildOccurrence(partial: Partial<ScheduleOccurrence>): ScheduleOccurrence {
  return {
    eventId: 'event-1',
    occurrenceKey: 'event-1:2026-03-23T10:00:00+08:00',
    title: '操作系统',
    startAt: '2026-03-23T10:00:00+08:00',
    endAt: '2026-03-23T11:00:00+08:00',
    timeMode: 'range',
    isOngoing: false,
    isUpcoming: true,
    isPast: false,
    repeatLabel: '每周 · 1-16周',
    colorToken: '#fff',
    progressColorToken: '#000',
    source: 'ics',
    ...partial,
  }
}

const notificationSettings: Pick<ScheduleWidgetSettings, 'notifyOnAlarm' | 'notifyOnStart' | 'notifyOnEnd'> = {
  notifyOnAlarm: true,
  notifyOnStart: true,
  notifyOnEnd: true,
}

describe('schedule notification helpers', () => {
  it('builds alarm, start and end checkpoints from one occurrence', () => {
    const checkpoints = buildNotificationCheckpoints([
      buildOccurrence({
        alarmOffsetMinutes: 10,
      }),
    ], notificationSettings)

    expect(checkpoints).toHaveLength(3)
    expect(checkpoints.map(item => item.kind)).toEqual(['alarm', 'start', 'end'])
    expect(checkpoints[0]?.timestamp).toBe('2026-03-23T01:50:00.000Z')
  })

  it('uses 10 minutes by default when no checkpoint is near', () => {
    const delay = getRecommendedRefreshDelay([
      '2026-03-23T12:00:00+08:00',
    ], '2026-03-23T10:00:00+08:00')

    expect(delay).toBe(REFRESH_DELAYS.default)
  })

  it('uses 30 seconds when the next checkpoint is within 10 minutes', () => {
    const delay = getRecommendedRefreshDelay([
      '2026-03-23T10:08:00+08:00',
    ], '2026-03-23T10:00:00+08:00')

    expect(delay).toBe(REFRESH_DELAYS.near)
  })

  it('uses 10 seconds when the next checkpoint is within 1 minute', () => {
    const delay = getRecommendedRefreshDelay([
      '2026-03-23T10:00:40+08:00',
    ], '2026-03-23T10:00:00+08:00')

    expect(delay).toBe(REFRESH_DELAYS.imminent)
  })

  it('keeps a warm refresh cadence while an event is ongoing', () => {
    const delay = getRecommendedRefreshDelay([], '2026-03-23T10:00:00+08:00', {
      hasOngoing: true,
    })

    expect(delay).toBe(REFRESH_DELAYS.near)
  })

  it('keeps countdown and progress visuals updating when there are active list items', () => {
    const delay = getRecommendedRefreshDelay([], '2026-03-23T10:00:00+08:00', {
      keepActive: true,
    })

    expect(delay).toBe(REFRESH_DELAYS.near)
  })
})
