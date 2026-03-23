import ICAL from 'ical.js'
import { collapseIcsToCourseSeries, parseValarmOffsetMinutes } from '../model/ics-course'
import { normalizeEventRecord } from '../model/normalize'
import type { ScheduleEventRecord } from '../model/types'

function toIsoFromICAL(value: { toJSDate: () => Date } | undefined) {
  return value?.toJSDate().toISOString()
}

export function parseIcsEvents(content: string): ScheduleEventRecord[] {
  const root = new ICAL.Component(ICAL.parse(content))
  const events = root.getAllSubcomponents('vevent')

  const recurring = events
    .filter(component => Boolean(component.getFirstPropertyValue('rrule')))
    .map((component) => {
      const event = new ICAL.Event(component)
      const summary = event.summary || component.getFirstPropertyValue('summary') || '未命名日程'
      const description = component.getFirstPropertyValue('description') || undefined
      const location = component.getFirstPropertyValue('location') || undefined
      const rrule = component.getFirstPropertyValue('rrule')
      const alarmTrigger = component
        .getAllSubcomponents('valarm')
        .map(item => item.getFirstPropertyValue('trigger'))
        .find(Boolean)
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
        alarmOffsetMinutes: parseValarmOffsetMinutes(
          typeof alarmTrigger === 'string' ? alarmTrigger : alarmTrigger?.toString?.(),
        ),
        recurrenceType: 'custom',
        recurrenceRRule: rrule ? rrule.toString() : undefined,
        exdates: exdates.length > 0 ? exdates : undefined,
      })
    })

  const flattened = events
    .filter(component => !component.getFirstPropertyValue('rrule'))
    .map((component) => {
    const event = new ICAL.Event(component)
    const summary = event.summary || component.getFirstPropertyValue('summary') || '未命名日程'
    const description = component.getFirstPropertyValue('description') || undefined
    const location = component.getFirstPropertyValue('location') || undefined
    const alarmTrigger = component
      .getAllSubcomponents('valarm')
      .map(item => item.getFirstPropertyValue('trigger'))
      .find(Boolean)
    const alarmOffsetMinutes = parseValarmOffsetMinutes(
      typeof alarmTrigger === 'string' ? alarmTrigger : alarmTrigger?.toString?.(),
    )

    return {
      uid: event.uid,
      title: summary,
      description,
      location,
      startAt: toIsoFromICAL(event.startDate),
      endAt: toIsoFromICAL(event.endDate),
      allDay: event.startDate?.isDate,
      alarmOffsetMinutes,
    }
  })

  const collapsed = collapseIcsToCourseSeries(flattened).map(event =>
    normalizeEventRecord({
      id: event.uid,
      ...event,
    }, 'ics'),
  )

  return [...collapsed, ...recurring]
}
