import { buildDefaultSettings } from './defaults'
import { dayjs } from './date'
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
  fallbackColors = buildDefaultSettings(),
): ScheduleOccurrence {
  const start = dayjs(startAt)
  const end = endAt ? dayjs(endAt) : start
  const current = dayjs(now)
  const isOngoing = !current.isBefore(start) && current.isBefore(end)
  const isUpcoming = current.isBefore(start)
  const isPast = !isOngoing && !isUpcoming

  return {
    eventId: event.id,
    occurrenceKey: `${event.id}:${start.toISOString()}`,
    title: event.title,
    description: event.description,
    location: event.location,
    startAt: start.toISOString(),
    endAt: endAt ? end.toISOString() : undefined,
    timeMode: event.timeMode,
    isOngoing,
    isUpcoming,
    isPast,
    repeatLabel: getRepeatLabel(event),
    colorToken: event.color ?? fallbackColors.cardColor,
    progressColorToken: event.progressColor ?? fallbackColors.progressColor,
    source: event.source,
  }
}

function expandSingleEvent(
  event: ScheduleEventRecord,
  rangeStart: string,
  rangeEnd: string,
  now: string,
  fallbackColors: ReturnType<typeof buildDefaultSettings>,
) {
  if (!overlapsRange(event.startAt, event.endAt, rangeStart, rangeEnd)) {
    return []
  }

  return [buildOccurrence(event, event.startAt, event.endAt, now, fallbackColors)]
}

function expandRecurringEvent(
  event: ScheduleEventRecord,
  rangeStart: string,
  rangeEnd: string,
  now: string,
  fallbackColors: ReturnType<typeof buildDefaultSettings>,
) {
  const rrule = buildRRule(event)
  if (!rrule) {
    return expandSingleEvent(event, rangeStart, rangeEnd, now, fallbackColors)
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
      const occurrenceStart = dayjs(date).toISOString()
      const occurrenceEnd = event.endAt
        ? dayjs(date).add(durationMs, 'millisecond').toISOString()
        : undefined

      if (!matchesWeeksExpression(event.startAt, occurrenceStart, event.recurrenceWeeks)) {
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
        fallbackColors,
      )
    })
    .filter((item): item is ScheduleOccurrence => Boolean(item))
}

export function expandEventsInRange({
  events,
  rangeStart,
  rangeEnd,
  now,
  settings,
}: ExpandEventsRangeInput) {
  const fallbackColors = {
    ...buildDefaultSettings(),
    ...settings,
  }

  return events
    .flatMap((event) => {
      if (isRecurringEvent(event)) {
        return expandRecurringEvent(event, rangeStart, rangeEnd, now, fallbackColors)
      }

      return expandSingleEvent(event, rangeStart, rangeEnd, now, fallbackColors)
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
