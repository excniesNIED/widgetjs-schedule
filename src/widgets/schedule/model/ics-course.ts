import { dayjs, toLocalTime, toWeekdayNumber } from './date'
import { normalizeWeeksExpression } from './recurrence'
import type { ScheduleEventRecord } from './types'

export interface ParsedIcsDescription {
  location?: string
  teacher?: string
  weeks?: string
  sectionText?: string
  description?: string
}

export interface RawIcsEvent {
  uid?: string
  title: string
  description?: string
  location?: string
  startAt: string
  endAt?: string
  allDay?: boolean
  alarmOffsetMinutes?: number
}

interface ParsedIcsSeriesItem extends RawIcsEvent {
  teacher?: string
  sectionText?: string
  weeks?: string
  weekHint?: number
}

function extractWeekHintFromUid(uid?: string) {
  if (!uid) {
    return undefined
  }

  const match = uid.match(/-w(\d+)-/i)
  if (!match) {
    return undefined
  }

  return Number(match[1])
}

function normalizeWeeksList(values: number[]) {
  if (values.length === 0) {
    return undefined
  }

  const unique = Array.from(new Set(values)).sort((left, right) => left - right)
  return unique.join(',')
}

function getFirstWeekFromWeeksExpression(weeks?: string) {
  if (!weeks) {
    return undefined
  }

  const normalized = normalizeWeeksExpression(weeks)
  if (!normalized) {
    return undefined
  }

  const firstPart = normalized.split(',')[0]
  if (!firstPart) {
    return undefined
  }

  if (firstPart.includes('-')) {
    return Number(firstPart.split('-')[0]?.replace(/[^\d]/g, ''))
  }

  return Number(firstPart.replace(/[^\d]/g, ''))
}

export function parseIcsDescription(raw?: string): ParsedIcsDescription {
  if (!raw) {
    return {}
  }

  const segments = raw
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)

  let location: string | undefined
  let teacher: string | undefined
  let weeks: string | undefined
  let sectionText: string | undefined

  const extras: string[] = []

  for (const segment of segments) {
    const [rawKey, ...valueParts] = segment.split(':')
    if (valueParts.length === 0) {
      extras.push(segment)
      continue
    }

    const key = rawKey.trim()
    const value = valueParts.join(':').trim()

    if (/^地点$/.test(key)) {
      location = value || undefined
      continue
    }

    if (/^教师$/.test(key)) {
      teacher = value || undefined
      continue
    }

    if (/^周数$/.test(key)) {
      weeks = normalizeWeeksExpression(value)
      continue
    }

    if (/^节次$/.test(key)) {
      sectionText = value || undefined
      continue
    }

    extras.push(segment)
  }

  const description = [
    location ? `地点：${location}` : '',
    teacher ? `教师：${teacher}` : '',
    sectionText ? `节次：${sectionText}` : '',
    ...extras,
  ]
    .filter(Boolean)
    .join(' · ')

  return {
    location,
    teacher,
    weeks,
    sectionText,
    description: description || undefined,
  }
}

export function parseValarmOffsetMinutes(trigger?: string | null) {
  if (!trigger) {
    return undefined
  }

  const trimmed = trigger.trim().toUpperCase()
  const match = trimmed.match(/^-P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/)
  if (!match) {
    return undefined
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60)
  return totalMinutes > 0 ? totalMinutes : undefined
}

function buildSeriesKey(event: ParsedIcsSeriesItem) {
  return [
    event.title.trim(),
    toWeekdayNumber(event.startAt),
    toLocalTime(event.startAt),
    event.endAt ? toLocalTime(event.endAt) : '',
    event.location?.trim() || '',
    event.teacher?.trim() || '',
    event.sectionText?.trim() || '',
    event.weeks?.trim() || '',
  ].join('::')
}

function shouldCollapseToSeries(events: ParsedIcsSeriesItem[]) {
  if (events.length > 1) {
    return true
  }

  return Boolean(events[0]?.weeks || events[0]?.weekHint)
}

export function collapseIcsToCourseSeries(rawEvents: RawIcsEvent[]): Partial<ScheduleEventRecord>[] {
  const parsed = rawEvents.map<ParsedIcsSeriesItem>((event) => {
    const parsedDescription = parseIcsDescription(event.description)

    return {
      ...event,
      description: parsedDescription.description ?? event.description,
      location: parsedDescription.location ?? event.location,
      teacher: parsedDescription.teacher,
      sectionText: parsedDescription.sectionText,
      weeks: parsedDescription.weeks,
      weekHint: extractWeekHintFromUid(event.uid),
    }
  })

  const grouped = new Map<string, ParsedIcsSeriesItem[]>()

  for (const event of parsed) {
    const key = buildSeriesKey(event)
    grouped.set(key, [...(grouped.get(key) ?? []), event])
  }

  return Array.from(grouped.values()).map((items) => {
    const sortedItems = [...items].sort((left, right) =>
      dayjs(left.startAt).valueOf() - dayjs(right.startAt).valueOf(),
    )
    const first = sortedItems[0]!

    if (!shouldCollapseToSeries(sortedItems)) {
      return {
        uid: first.uid,
        title: first.title,
        description: first.description,
        location: first.location,
        teacher: first.teacher,
        sectionText: first.sectionText,
        source: 'ics',
        timeMode: first.endAt ? 'range' : 'point',
        startAt: first.startAt,
        endAt: first.endAt,
        allDay: first.allDay,
        alarmOffsetMinutes: first.alarmOffsetMinutes,
        recurrenceType: 'none',
      }
    }

    const weekHints = sortedItems
      .map(item => item.weekHint)
      .filter((value): value is number => typeof value === 'number' && value > 0)
    const weeks = first.weeks ?? normalizeWeeksList(weekHints)
    const firstWeek = getFirstWeekFromWeeksExpression(weeks)
    const recurrenceWeekStart = first.weekHint ?? firstWeek
    const weekAdjustment = recurrenceWeekStart && firstWeek && recurrenceWeekStart > firstWeek
      ? recurrenceWeekStart - firstWeek
      : 0
    const canonicalStart = weekAdjustment > 0
      ? dayjs(first.startAt).subtract(weekAdjustment, 'week').toISOString()
      : first.startAt
    const canonicalEnd = first.endAt && weekAdjustment > 0
      ? dayjs(first.endAt).subtract(weekAdjustment, 'week').toISOString()
      : first.endAt

    return {
      uid: first.uid ?? `${first.title}-${first.startAt}`,
      title: first.title,
      description: first.description,
      location: first.location,
      teacher: first.teacher,
      sectionText: first.sectionText,
      source: 'ics',
      timeMode: first.endAt ? 'range' : 'point',
      startAt: canonicalStart,
      endAt: canonicalEnd,
      allDay: first.allDay,
      alarmOffsetMinutes: first.alarmOffsetMinutes,
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
      recurrenceWeekdays: [toWeekdayNumber(first.startAt)],
      recurrenceWeeks: weeks,
      recurrenceWeekStart: firstWeek ?? recurrenceWeekStart,
    }
  })
}
