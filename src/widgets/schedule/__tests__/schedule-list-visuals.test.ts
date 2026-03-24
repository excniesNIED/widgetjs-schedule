import { describe, expect, it } from 'vitest'
import { getOccurrenceFillRatio, getOccurrenceStatusText } from '../model/list'
import type { ScheduleOccurrence } from '../model/types'

function buildOccurrence(partial: Partial<ScheduleOccurrence>): ScheduleOccurrence {
  return {
    eventId: 'event-1',
    occurrenceKey: 'event-1:2026-03-23T10:00:00+08:00',
    title: '高等数学',
    startAt: '2026-03-23T10:00:00+08:00',
    endAt: '2026-03-23T11:00:00+08:00',
    timeMode: 'range',
    isOngoing: false,
    isUpcoming: true,
    isPast: false,
    repeatLabel: '单次',
    colorToken: '#fff',
    progressColorToken: '#000',
    source: 'manual',
    ...partial,
  }
}

describe('schedule list visuals', () => {
  it('uses ongoing event progress as the fill ratio in progress mode', () => {
    const ratio = getOccurrenceFillRatio(
      buildOccurrence({
        isOngoing: true,
        isUpcoming: false,
      }),
      '2026-03-23T10:30:00+08:00',
      'progress',
    )

    expect(ratio).toBe(0.5)
  })

  it('uses remaining time for the current event in countdown mode', () => {
    const ratio = getOccurrenceFillRatio(
      buildOccurrence({
        isOngoing: true,
        isUpcoming: false,
      }),
      '2026-03-23T10:45:00+08:00',
      'countdown',
    )

    expect(ratio).toBe(0.25)
  })

  it('does not treat upcoming events as countdown targets', () => {
    const ratio = getOccurrenceFillRatio(
      buildOccurrence(),
      '2026-03-23T09:30:00+08:00',
      'countdown',
    )

    expect(ratio).toBe(0)
  })

  it('shows remaining time text for the current event in countdown mode', () => {
    const text = getOccurrenceStatusText(
      buildOccurrence({
        isOngoing: true,
        isUpcoming: false,
      }),
      '2026-03-23T10:30:00+08:00',
      'countdown',
    )

    expect(text).toBe('剩余 30 分钟')
  })

  it('keeps generic state labels outside countdown mode', () => {
    const text = getOccurrenceStatusText(
      buildOccurrence({
        isOngoing: true,
        isUpcoming: false,
      }),
      '2026-03-23T10:30:00+08:00',
      'progress',
    )

    expect(text).toBe('正在进行')
  })
})
