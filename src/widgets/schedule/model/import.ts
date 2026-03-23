import { normalizeEventRecord } from './normalize'
import { dayjs } from './date'
import type { ScheduleEventRecord } from './types'

export function mergeImportedEvents(
  existingEvents: ScheduleEventRecord[],
  importedEvents: ScheduleEventRecord[],
) {
  const normalized = importedEvents.map(event => normalizeEventRecord(event, event.source))
  const importedSources = new Set(normalized.map(event => event.source))
  const preserved = existingEvents.filter(event => !importedSources.has(event.source))
  return [...preserved, ...normalized]
    .sort((left, right) => dayjs(right.updatedAt).valueOf() - dayjs(left.updatedAt).valueOf())
}
