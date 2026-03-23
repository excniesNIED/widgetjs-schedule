import { describe, expect, it } from 'vitest'
import type { ScheduleEventRecord } from '../model/types'
import {
  buildDefaultEvent,
  buildDefaultSettings,
} from '../model/defaults'
import { toLocalDate } from '../model/date'
import {
  expandEventsInRange,
  getCurrentAndNextOccurrence,
  getRepeatLabel,
} from '../model/occurrence'

function buildEvent(partial: Partial<ScheduleEventRecord>): ScheduleEventRecord {
  return {
    ...buildDefaultEvent(),
    ...partial,
  }
}

describe('schedule occurrence model', () => {
  it('expands a single range event inside the requested day', () => {
    const event = buildEvent({
      title: '项目站会',
      timeMode: 'range',
      startAt: '2026-03-23T10:00:00+08:00',
      endAt: '2026-03-23T10:30:00+08:00',
    })

    const occurrences = expandEventsInRange({
      events: [event],
      rangeStart: '2026-03-23T00:00:00+08:00',
      rangeEnd: '2026-03-23T23:59:59+08:00',
      now: '2026-03-23T10:10:00+08:00',
      settings: buildDefaultSettings(),
    })

    expect(occurrences).toHaveLength(1)
    expect(occurrences[0]?.isOngoing).toBe(true)
    expect(occurrences[0]?.title).toBe('项目站会')
  })

  it('expands weekday recurrence and skips weekends', () => {
    const event = buildEvent({
      title: '工作日例会',
      timeMode: 'range',
      startAt: '2026-03-23T09:00:00+08:00',
      endAt: '2026-03-23T09:30:00+08:00',
      recurrenceType: 'weekdays',
      recurrenceInterval: 1,
      recurrenceWeekdays: [1, 2, 3, 4, 5],
    })

    const occurrences = expandEventsInRange({
      events: [event],
      rangeStart: '2026-03-23T00:00:00+08:00',
      rangeEnd: '2026-03-29T23:59:59+08:00',
      now: '2026-03-23T08:00:00+08:00',
      settings: buildDefaultSettings(),
    })

    expect(occurrences).toHaveLength(5)
    expect(occurrences.map(item => toLocalDate(item.startAt))).toEqual([
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
    ])
  })

  it('expands custom RRULE events and formats repeat label', () => {
    const event = buildEvent({
      title: '晨读',
      startAt: '2026-03-23T07:30:00+08:00',
      endAt: '2026-03-23T08:00:00+08:00',
      timeMode: 'range',
      recurrenceType: 'custom',
      recurrenceRRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
      recurrenceWeekdays: [1, 3, 5],
    })

    const occurrences = expandEventsInRange({
      events: [event],
      rangeStart: '2026-03-23T00:00:00+08:00',
      rangeEnd: '2026-03-30T23:59:59+08:00',
      now: '2026-03-23T06:00:00+08:00',
      settings: buildDefaultSettings(),
    })

    expect(occurrences).toHaveLength(4)
    expect(getRepeatLabel(event)).toContain('自定义')
  })

  it('identifies current and next occurrences', () => {
    const events = [
      buildEvent({
        title: '正在进行',
        timeMode: 'range',
        startAt: '2026-03-23T10:00:00+08:00',
        endAt: '2026-03-23T11:00:00+08:00',
      }),
      buildEvent({
        title: '接下来',
        timeMode: 'range',
        startAt: '2026-03-23T11:30:00+08:00',
        endAt: '2026-03-23T12:00:00+08:00',
      }),
    ]

    const occurrences = expandEventsInRange({
      events,
      rangeStart: '2026-03-23T00:00:00+08:00',
      rangeEnd: '2026-03-23T23:59:59+08:00',
      now: '2026-03-23T10:10:00+08:00',
      settings: buildDefaultSettings(),
    })
    const summary = getCurrentAndNextOccurrence(occurrences)

    expect(summary.current?.title).toBe('正在进行')
    expect(summary.next?.title).toBe('接下来')
  })

  it('expands imported course series from the canonical academic week start', () => {
    const event = buildEvent({
      title: '算法设计与分析',
      timeMode: 'range',
      startAt: '2026-05-04T10:10:00+08:00',
      endAt: '2026-05-04T11:45:00+08:00',
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
      recurrenceWeekdays: [1],
      recurrenceWeeks: '9-16',
      recurrenceWeekStart: 9,
    })

    const occurrences = expandEventsInRange({
      events: [event],
      rangeStart: '2026-05-04T00:00:00+08:00',
      rangeEnd: '2026-05-25T23:59:59+08:00',
      now: '2026-05-11T08:00:00+08:00',
      settings: buildDefaultSettings(),
    })

    expect(occurrences.map(item => toLocalDate(item.startAt))).toEqual([
      '2026-05-04',
      '2026-05-11',
      '2026-05-18',
      '2026-05-25',
    ])
  })

  it('can filter out past occurrences from today display', () => {
    const events = [
      buildEvent({
        title: '已经结束',
        timeMode: 'range',
        startAt: '2026-03-23T08:00:00+08:00',
        endAt: '2026-03-23T08:30:00+08:00',
      }),
      buildEvent({
        title: '正在进行',
        timeMode: 'range',
        startAt: '2026-03-23T10:00:00+08:00',
        endAt: '2026-03-23T11:00:00+08:00',
      }),
      buildEvent({
        title: '接下来',
        timeMode: 'range',
        startAt: '2026-03-23T11:30:00+08:00',
        endAt: '2026-03-23T12:00:00+08:00',
      }),
    ]

    const occurrences = expandEventsInRange({
      events,
      rangeStart: '2026-03-23T00:00:00+08:00',
      rangeEnd: '2026-03-23T23:59:59+08:00',
      now: '2026-03-23T10:10:00+08:00',
      settings: buildDefaultSettings(),
    })

    const visibleToday = occurrences.filter(item => !item.isPast)

    expect(visibleToday).toHaveLength(2)
    expect(visibleToday.map(item => item.title)).toEqual(['正在进行', '接下来'])
  })
})
