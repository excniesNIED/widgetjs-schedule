import Papa from 'papaparse'
import { toLocalDate, toLocalTime } from '../model/date'
import type { ScheduleEventRecord } from '../model/types'

export function exportEventsToCsv(events: ScheduleEventRecord[]) {
  return Papa.unparse(
    events.map(event => ({
      title: event.title,
      date: toLocalDate(event.startAt),
      start_time: toLocalTime(event.startAt),
      end_time: event.endAt ? toLocalTime(event.endAt) : '',
      repeat_type: event.recurrenceType,
      repeat_interval: event.recurrenceInterval ?? 1,
      weekdays: event.recurrenceWeekdays?.join(',') ?? '',
      weeks: event.recurrenceWeeks ?? '',
      description: event.description ?? '',
      location: event.location ?? '',
      color: event.color ?? '',
    })),
    {
      columns: [
        'title',
        'date',
        'start_time',
        'end_time',
        'repeat_type',
        'repeat_interval',
        'weekdays',
        'weeks',
        'description',
        'location',
        'color',
      ],
    },
  )
}
