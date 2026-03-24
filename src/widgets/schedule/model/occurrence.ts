import { dayjs, toIsoString } from './date'
import { formatOccurrenceTime, getRepeatLabel } from './format'
import {
  buildRRule,
  isRecurringEvent,
  matchesWeeksExpression,
} from './recurrence'
import type {
  ExpandEventsRangeInput,
  ScheduleEventRecord,
  ScheduleOccurrence,
  ScheduleSummary,
} from './types'

const POINT_EVENT_VISIBLE_MINUTES = 30

function overlapsRange(
  startAt: string,
  endAt: string | undefined,
  rangeStart: string,
  rangeEnd: string,
) {
  const start = dayjs(startAt)
  const end = endAt ? dayjs(endAt) : start
  const rangeStartDate = dayjs(rangeStart)
  const rangeEndDate = dayjs(rangeEnd)

  return !end.isBefore(rangeStartDate) && !start.isAfter(rangeEndDate)
}

function buildOccurrence(
  event: ScheduleEventRecord,
  startAt: string,
  endAt: string | undefined,
  now: string,
): ScheduleOccurrence {
  const start = dayjs(startAt)
  const end = endAt ? dayjs(endAt) : start.add(POINT_EVENT_VISIBLE_MINUTES, 'minute')
  const current = dayjs(now)
  const isOngoing = !current.isBefore(start) && current.isBefore(end)
  const isUpcoming = current.isBefore(start)
  const isPast = !isOngoing && !isUpcoming

  return {
    eventId: event.id,
    occurrenceKey: `${event.id}:${toIsoString(start)}`,
    title: event.title,
    description: event.description,
    teacher: event.teacher,
    sectionText: event.sectionText,
    startAt: toIsoString(start),
    endAt: endAt ? toIsoString(end) : undefined,
    timeMode: event.timeMode,
    isOngoing,
    isUpcoming,
    isPast,
    alarmOffsetMinutes: event.alarmOffsetMinutes,
    repeatLabel: getRepeatLabel(event),
    colorToken: event.color ?? '',
    progressColorToken: event.progressColor ?? '',
    source: event.source,
  }
}

function expandSingleEvent(
  event: ScheduleEventRecord,
  rangeStart: string,
  rangeEnd: string,
  now: string,
) {
  if (!overlapsRange(event.startAt, event.endAt, rangeStart, rangeEnd)) {
    return []
  }

  return [buildOccurrence(event, event.startAt, event.endAt, now)]
}

function expandRecurringEvent(
  event: ScheduleEventRecord,
  rangeStart: string,
  rangeEnd: string,
  now: string,
) {
  const rrule = buildRRule(event)
  if (!rrule) {
    return expandSingleEvent(event, rangeStart, rangeEnd, now)
  }

  const durationMs = event.endAt
    ? dayjs(event.endAt).diff(dayjs(event.startAt), 'millisecond')
    : 0
  const lookBehindStart = durationMs > 0
    ? dayjs(rangeStart).subtract(durationMs, 'millisecond')
    : dayjs(rangeStart)

  return rrule
    .between(lookBehindStart.toDate(), dayjs(rangeEnd).toDate(), true)
    .map((date) => {
      const occurrenceStart = toIsoString(dayjs(date))
      const occurrenceEnd = event.endAt
        ? toIsoString(dayjs(date).add(durationMs, 'millisecond'))
        : undefined

      if (!matchesWeeksExpression(
        event.startAt,
        occurrenceStart,
        event.recurrenceWeeks,
        event.recurrenceWeekStart,
      )) {
        return undefined
      }

      if (!overlapsRange(occurrenceStart, occurrenceEnd, rangeStart, rangeEnd)) {
        return undefined
      }

      if (event.exdates?.some(exdate => dayjs(exdate).isSame(dayjs(occurrenceStart)))) {
        return undefined
      }

      return buildOccurrence(
        event,
        occurrenceStart,
        occurrenceEnd,
        now,
      )
    })
    .filter((item): item is ScheduleOccurrence => Boolean(item))
}

export function expandEventsInRange({
  events,
  rangeStart,
  rangeEnd,
  now,
}: ExpandEventsRangeInput) {
  return events
    .flatMap((event) => {
      if (isRecurringEvent(event)) {
        return expandRecurringEvent(event, rangeStart, rangeEnd, now)
      }

      return expandSingleEvent(event, rangeStart, rangeEnd, now)
    })
    .sort((left, right) => dayjs(left.startAt).valueOf() - dayjs(right.startAt).valueOf())
}

export function getCurrentAndNextOccurrence(
  occurrences: ScheduleOccurrence[],
): ScheduleSummary {
  return {
    current: occurrences.find(occurrence => occurrence.isOngoing),
    next: occurrences.find(occurrence => occurrence.isUpcoming),
  }
}

export { formatOccurrenceTime, getRepeatLabel }
