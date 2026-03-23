import { describe, expect, it } from 'vitest'
import type { ScheduleEventRecord } from '../model/types'
import { buildDefaultEvent } from '../model/defaults'
import { parseCsvEvents } from '../importers/csv'
import { exportEventsToCsv } from '../exporters/csv'
import { parseJsonEvents } from '../importers/json'
import { exportEventsToJson } from '../exporters/json'
import { parseIcsEvents } from '../importers/ics'
import { exportEventsToIcs } from '../exporters/ics'

function buildEvent(partial: Partial<ScheduleEventRecord>): ScheduleEventRecord {
  return {
    ...buildDefaultEvent(),
    ...partial,
  }
}

describe('schedule import export', () => {
  it('parses csv and extracts weeks from description when column is empty', () => {
    const csv = [
      'title,date,start_time,end_time,repeat_type,repeat_interval,weekdays,weeks,description,location,color',
      '高等数学,2026-03-23,08:20,09:55,weekly,1,"1,3,5",,"1-16周，理科楼A302",理科楼A302,#dbeafe',
    ].join('\n')

    const result = parseCsvEvents(csv)

    expect(result.errors).toHaveLength(0)
    expect(result.events).toHaveLength(1)
    expect(result.events[0]?.recurrenceWeeks).toBe('1-16')
    expect(result.events[0]?.title).toBe('高等数学')
  })

  it('exports csv in a re-importable shape', () => {
    const event = buildEvent({
      title: '午休提醒',
      timeMode: 'point',
      startAt: '2026-03-23T12:30:00+08:00',
      recurrenceType: 'daily',
      recurrenceInterval: 1,
    })

    const csv = exportEventsToCsv([event])

    expect(csv).toContain('title,date,start_time,end_time,repeat_type')
    expect(csv).toContain('午休提醒')
  })

  it('parses and exports json arrays', () => {
    const json = JSON.stringify([
      {
        title: '项目站会',
        startAt: '2026-03-23T10:00:00+08:00',
        endAt: '2026-03-23T10:30:00+08:00',
        timeMode: 'range',
      },
    ])

    const events = parseJsonEvents(json)
    const serialized = exportEventsToJson(events)

    expect(events).toHaveLength(1)
    expect(JSON.parse(serialized)).toHaveLength(1)
  })

  it('parses ICS into normalized events and preserves RRULE on export', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schedule Test//EN',
      'BEGIN:VEVENT',
      'UID:test-event',
      'SUMMARY:线性代数',
      'DESCRIPTION:1-16周，教学楼301',
      'LOCATION:教学楼301',
      'DTSTART:20260323T002000Z',
      'DTEND:20260323T015500Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'EXDATE:20260406T002000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = parseIcsEvents(ics)
    const serialized = exportEventsToIcs(events)

    expect(events).toHaveLength(1)
    expect(events[0]?.title).toBe('线性代数')
    expect(events[0]?.location).toBe('教学楼301')
    expect(events[0]?.recurrenceRRule).toContain('FREQ=WEEKLY')
    expect(serialized).toContain('BEGIN:VEVENT')
    expect(serialized).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('collapses repeated course vevents into one weekly course series', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schedule Test//EN',
      'BEGIN:VEVENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT10M',
      'END:VALARM',
      'UID:event-os-w10-a',
      'SUMMARY:操作系统',
      'DESCRIPTION:地点: 文渊楼C座355 | 教师: 洪潇 | 周数: 1-16周 | 节次: 5-6节',
      'LOCATION:文渊楼C座355',
      'DTSTART:20260511T060000Z',
      'DTEND:20260511T073500Z',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT10M',
      'END:VALARM',
      'UID:event-os-w11-b',
      'SUMMARY:操作系统',
      'DESCRIPTION:地点: 文渊楼C座355 | 教师: 洪潇 | 周数: 1-16周 | 节次: 5-6节',
      'LOCATION:文渊楼C座355',
      'DTSTART:20260518T060000Z',
      'DTEND:20260518T073500Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = parseIcsEvents(ics)

    expect(events).toHaveLength(1)
    expect(events[0]?.title).toBe('操作系统')
    expect(events[0]?.recurrenceType).toBe('weekly')
    expect(events[0]?.recurrenceWeeks).toBe('1-16')
    expect(events[0]?.recurrenceWeekStart).toBe(1)
    expect(events[0]?.teacher).toBe('洪潇')
    expect(events[0]?.sectionText).toBe('5-6节')
    expect(events[0]?.alarmOffsetMinutes).toBe(10)
    expect(events[0]?.description).toContain('教师：洪潇')
  })

  it('keeps academic week anchor when imported course starts from later weeks', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schedule Test//EN',
      'BEGIN:VEVENT',
      'UID:event-algo-w10-a',
      'SUMMARY:算法设计与分析',
      'DESCRIPTION:地点: 文渊楼C座129 | 教师: 杜萍 | 周数: 9-16周 | 节次: 3-4节',
      'LOCATION:文渊楼C座129',
      'DTSTART:20260511T021000Z',
      'DTEND:20260511T034500Z',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:event-algo-w11-b',
      'SUMMARY:算法设计与分析',
      'DESCRIPTION:地点: 文渊楼C座129 | 教师: 杜萍 | 周数: 9-16周 | 节次: 3-4节',
      'LOCATION:文渊楼C座129',
      'DTSTART:20260518T021000Z',
      'DTEND:20260518T034500Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = parseIcsEvents(ics)

    expect(events).toHaveLength(1)
    expect(events[0]?.recurrenceWeeks).toBe('9-16')
    expect(events[0]?.recurrenceWeekStart).toBe(9)
  })
})
