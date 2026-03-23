import { toRRuleString } from '../model/recurrence'
import type { ScheduleEventRecord } from '../model/types'

function escapeText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function toIcsDate(value: string) {
  return value
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .replace('+00:00', 'Z')
}

export function exportEventsToIcs(events: ScheduleEventRecord[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WidgetJS Schedule//CN',
  ]

  for (const event of events) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${escapeText(event.uid ?? event.id)}`)
    lines.push(`DTSTAMP:${toIcsDate(new Date().toISOString())}`)
    lines.push(`SUMMARY:${escapeText(event.title)}`)

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`)
    }

    lines.push(`DTSTART:${toIcsDate(event.startAt)}`)

    if (event.endAt) {
      lines.push(`DTEND:${toIcsDate(event.endAt)}`)
    }

    const rrule = toRRuleString(event)
    if (rrule) {
      lines.push(`RRULE:${rrule}`)
    }

    if (event.exdates && event.exdates.length > 0) {
      lines.push(`EXDATE:${event.exdates.map(toIcsDate).join(',')}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
