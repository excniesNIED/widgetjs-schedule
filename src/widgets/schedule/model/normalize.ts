import { buildDefaultEvent } from './defaults'
import { toIsoString } from './date'
import type { ScheduleEventRecord, ScheduleSource } from './types'

export function normalizeEventRecord(
  input: Partial<ScheduleEventRecord>,
  source: ScheduleSource = input.source ?? 'manual',
): ScheduleEventRecord {
  const base = buildDefaultEvent({
    source,
    ...input,
  })

  const normalizedWeekdays = Array.from(
    new Set((input.recurrenceWeekdays ?? []).filter(day => day >= 1 && day <= 7)),
  ).sort((left, right) => left - right)

  return {
    ...base,
    source,
    title: input.title?.trim() ?? base.title,
    timeMode: input.timeMode ?? (input.endAt ? 'range' : 'point'),
    startAt: toIsoString(input.startAt ?? base.startAt),
    endAt: input.endAt ? toIsoString(input.endAt) : undefined,
    alarmOffsetMinutes: typeof input.alarmOffsetMinutes === 'number'
      ? input.alarmOffsetMinutes
      : undefined,
    recurrenceType: input.recurrenceType ?? 'none',
    recurrenceInterval: input.recurrenceInterval && input.recurrenceInterval > 0
      ? input.recurrenceInterval
      : 1,
    recurrenceWeekdays: normalizedWeekdays.length > 0 ? normalizedWeekdays : undefined,
    recurrenceWeeks: input.recurrenceWeeks?.trim() || undefined,
    recurrenceWeekStart: input.recurrenceWeekStart && input.recurrenceWeekStart > 0
      ? input.recurrenceWeekStart
      : undefined,
    recurrenceRRule: input.recurrenceRRule?.trim() || undefined,
    exdates: input.exdates?.map(item => toIsoString(item)),
    description: input.description?.trim() || undefined,
    teacher: input.teacher?.trim() || undefined,
    sectionText: input.sectionText?.trim() || undefined,
    color: input.color ?? base.color,
    progressColor: input.progressColor ?? base.progressColor,
    createdAt: input.createdAt ? toIsoString(input.createdAt) : base.createdAt,
    updatedAt: input.updatedAt ? toIsoString(input.updatedAt) : toIsoString(new Date()),
  }
}
