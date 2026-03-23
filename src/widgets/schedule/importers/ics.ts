import ICAL from 'ical.js'
import { normalizeEventRecord } from '../model/normalize'
import { extractWeeksExpression } from '../model/recurrence'
import type { ScheduleEventRecord } from '../model/types'

function toIsoFromICAL(value: { toJSDate: () => Date } | undefined) {
  return value?.toJSDate().toISOString()
}

export function parseIcsEvents(content: string): ScheduleEventRecord[] {
  const root = new ICAL.Component(ICAL.parse(content))
  const events = root.getAllSubcomponents('vevent')

  return events.map((component) => {
    const event = new ICAL.Event(component)
    const summary = event.summary || component.getFirstPropertyValue('summary') || '未命名日程'
    const description = component.getFirstPropertyValue('description') || undefined
    const location = component.getFirstPropertyValue('location') || undefined
    const rrule = component.getFirstPropertyValue('rrule')
    const exdates = component
      .getAllProperties('exdate')
      .flatMap((property: any) => property.getValues().map((value: any) => value.toJSDate().toISOString()))

    return normalizeEventRecord({
      id: event.uid,
      uid: event.uid,
      title: summary,
      description,
      location,
      source: 'ics',
      timeMode: event.endDate ? 'range' : 'point',
      startAt: toIsoFromICAL(event.startDate),
      endAt: toIsoFromICAL(event.endDate),
      allDay: event.startDate?.isDate,
      recurrenceType: rrule ? 'custom' : 'none',
      recurrenceRRule: rrule ? rrule.toString() : undefined,
      recurrenceWeeks: extractWeeksExpression(description, location),
      exdates: exdates.length > 0 ? exdates : undefined,
    })
  })
}
