import type { ScheduleEventRecord } from '../model/types'

export function exportEventsToJson(events: ScheduleEventRecord[]) {
  return JSON.stringify(events, null, 2)
}
