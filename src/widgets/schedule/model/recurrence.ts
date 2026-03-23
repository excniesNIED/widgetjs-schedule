import { datetime, RRule, rrulestr } from 'rrule'
import { toDayjs, toWeekdayNumber } from './date'
import type { ScheduleEventRecord } from './types'

const WEEKDAY_MAP = {
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
  7: RRule.SU,
} as const

export function isRecurringEvent(event: ScheduleEventRecord) {
  return event.recurrenceType !== 'none' || Boolean(event.recurrenceRRule)
}

function normalizeRRule(rule: string) {
  return rule.replace(/^RRULE:/i, '').trim()
}

export function normalizeWeeksExpression(raw?: string) {
  if (!raw) {
    return undefined
  }

  let normalized = raw
    .replace(/周数[:：]?/g, '')
    .replace(/第/g, '')
    .replace(/[()（）]/g, '')
    .replace(/周/g, '')
    .replace(/,/g, ',')
    .replace(/\s+/g, '')
    .trim()

  if (!normalized) {
    return undefined
  }

  const rangeMatch = normalized.match(/^(\d+)-(\d+)(单|双)?$/)
  if (rangeMatch) {
    const [, start, end, parity = ''] = rangeMatch
    return `${start}-${end}${parity}`
  }

  const listMatch = normalized.match(/^\d+(?:,\d+)+$/)
  if (listMatch) {
    return normalized
  }

  const singleMatch = normalized.match(/^\d+$/)
  if (singleMatch) {
    return normalized
  }

  return undefined
}

export function extractWeeksExpression(...texts: Array<string | undefined>) {
  for (const text of texts) {
    if (!text) {
      continue
    }

    const normalizedText = text.replace(/\s+/g, '')
    const rangeMatch = normalizedText.match(/(\d+-\d+周(?:[(（]?(?:单|双)[)）]?)?)/)
    if (rangeMatch) {
      return normalizeWeeksExpression(rangeMatch[1])
    }

    const listMatch = normalizedText.match(/第?(\d+(?:,\d+)+)周/)
    if (listMatch) {
      return normalizeWeeksExpression(listMatch[1])
    }
  }

  return undefined
}

function getEventWeekdays(event: ScheduleEventRecord) {
  if (event.recurrenceWeekdays && event.recurrenceWeekdays.length > 0) {
    return event.recurrenceWeekdays
  }

  return [toWeekdayNumber(event.startAt)]
}

export function getAcademicWeekNumber(
  baseStart: string,
  occurrenceStart: string,
  baseWeekNumber = 1,
) {
  const base = toDayjs(baseStart).startOf('isoWeek')
  const current = toDayjs(occurrenceStart).startOf('isoWeek')
  return current.diff(base, 'week') + baseWeekNumber
}

export function matchesWeeksExpression(
  baseStart: string,
  occurrenceStart: string,
  weeks?: string,
  baseWeekNumber = 1,
) {
  if (!weeks) {
    return true
  }

  const normalized = normalizeWeeksExpression(weeks)
  if (!normalized) {
    return true
  }

  const weekNumber = getAcademicWeekNumber(baseStart, occurrenceStart, baseWeekNumber)
  if (weekNumber < 1) {
    return false
  }

  if (normalized.includes(',')) {
    return normalized.split(',').map(Number).includes(weekNumber)
  }

  if (normalized.includes('-')) {
    const match = normalized.match(/^(\d+)-(\d+)(单|双)?$/)
    if (!match) {
      return true
    }

    const [, startText, endText, parity] = match
    const start = Number(startText)
    const end = Number(endText)
    if (weekNumber < start || weekNumber > end) {
      return false
    }

    if (parity === '单') {
      return weekNumber % 2 === 1
    }

    if (parity === '双') {
      return weekNumber % 2 === 0
    }

    return true
  }

  return Number(normalized) === weekNumber
}

function byWeekdayFromNumbers(days: number[]) {
  return days.map(day => WEEKDAY_MAP[day as keyof typeof WEEKDAY_MAP])
}

function toWallClockDate(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  )

  if (match) {
    const [, year, month, day, hour, minute, second = '0'] = match
    return datetime(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    )
  }

  const date = new Date(value)
  return datetime(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  )
}

export function toRRuleString(event: ScheduleEventRecord) {
  if (event.recurrenceRRule) {
    return normalizeRRule(event.recurrenceRRule)
  }

  const interval = event.recurrenceInterval && event.recurrenceInterval > 0
    ? event.recurrenceInterval
    : 1

  switch (event.recurrenceType) {
    case 'daily':
      return `FREQ=DAILY;INTERVAL=${interval}`
    case 'weekdays':
    case 'workdays':
      return `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=MO,TU,WE,TH,FR`
    case 'weekend':
      return `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=SA,SU`
    case 'weekly':
      return `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${getEventWeekdays(event)
        .map(day => WEEKDAY_MAP[day as keyof typeof WEEKDAY_MAP].toString())
        .join(',')}`
    case 'monthly':
      return `FREQ=MONTHLY;INTERVAL=${interval}`
    case 'yearly':
      return `FREQ=YEARLY;INTERVAL=${interval}`
    case 'every_n_minutes':
      return `FREQ=MINUTELY;INTERVAL=${interval}`
    case 'every_n_hours':
      return `FREQ=HOURLY;INTERVAL=${interval}`
    case 'every_n_days':
      return `FREQ=DAILY;INTERVAL=${interval}`
    case 'every_n_months':
      return `FREQ=MONTHLY;INTERVAL=${interval}`
    case 'every_n_years':
      return `FREQ=YEARLY;INTERVAL=${interval}`
    default:
      return undefined
  }
}

export function buildRRule(event: ScheduleEventRecord) {
  const normalizedRule = toRRuleString(event)
  if (!normalizedRule) {
    return undefined
  }

  if (event.recurrenceRRule) {
    return rrulestr(normalizedRule, {
      dtstart: toWallClockDate(event.startAt),
    }) as RRule
  }

  const interval = event.recurrenceInterval && event.recurrenceInterval > 0
    ? event.recurrenceInterval
    : 1
  const baseOptions = {
    dtstart: toWallClockDate(event.startAt),
    interval,
  }

  switch (event.recurrenceType) {
    case 'daily':
    case 'every_n_days':
      return new RRule({
        ...baseOptions,
        freq: RRule.DAILY,
      })
    case 'weekdays':
    case 'workdays':
      return new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
      })
    case 'weekend':
      return new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY,
        byweekday: [RRule.SA, RRule.SU],
      })
    case 'weekly':
      return new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY,
        byweekday: byWeekdayFromNumbers(getEventWeekdays(event)),
      })
    case 'monthly':
    case 'every_n_months':
      return new RRule({
        ...baseOptions,
        freq: RRule.MONTHLY,
      })
    case 'yearly':
    case 'every_n_years':
      return new RRule({
        ...baseOptions,
        freq: RRule.YEARLY,
      })
    case 'every_n_minutes':
      return new RRule({
        ...baseOptions,
        freq: RRule.MINUTELY,
      })
    case 'every_n_hours':
      return new RRule({
        ...baseOptions,
        freq: RRule.HOURLY,
      })
    default:
      return undefined
  }
}
