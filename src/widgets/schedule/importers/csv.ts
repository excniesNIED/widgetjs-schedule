import Papa from 'papaparse'
import { buildDefaultEvent } from '../model/defaults'
import { combineDateAndTime, isValidDateTime } from '../model/date'
import { normalizeEventRecord } from '../model/normalize'
import {
  extractWeeksExpression,
  normalizeWeeksExpression,
} from '../model/recurrence'
import type {
  ScheduleImportError,
  ScheduleImportResult,
  ScheduleRecurrenceType,
} from '../model/types'

interface CsvRow {
  title?: string
  date?: string
  start_time?: string
  end_time?: string
  repeat_type?: string
  repeat_interval?: string
  weekdays?: string
  weeks?: string
  description?: string
  location?: string
  color?: string
}

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function parseRecurrenceType(raw?: string): ScheduleRecurrenceType {
  const value = raw?.trim().toLowerCase()
  switch (value) {
    case 'daily':
    case 'weekdays':
    case 'workdays':
    case 'weekend':
    case 'weekly':
    case 'monthly':
    case 'yearly':
    case 'every_n_minutes':
    case 'every_n_hours':
    case 'every_n_days':
    case 'every_n_months':
    case 'every_n_years':
    case 'custom':
      return value
    default:
      return 'none'
  }
}

function parseWeekdays(raw?: string) {
  if (!raw) {
    return []
  }

  return Array.from(
    new Set(
      raw
        .split(',')
        .map(item => Number(item.trim()))
        .filter(item => item >= 1 && item <= 7),
    ),
  ).sort((left, right) => left - right)
}

export function parseCsvEvents(csv: string): ScheduleImportResult {
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeader,
  })

  const errors: ScheduleImportError[] = []
  const events = parsed.data.flatMap((row, index) => {
    const title = row.title?.trim()
    const date = row.date?.trim()
    const startTime = row.start_time?.trim()
    const endTime = row.end_time?.trim()
    const repeatType = parseRecurrenceType(row.repeat_type)

    if (!title) {
      errors.push({ row: index + 2, message: '缺少 title 字段' })
      return []
    }

    if (!date) {
      errors.push({ row: index + 2, message: '缺少 date 字段' })
      return []
    }

    if (!startTime) {
      errors.push({ row: index + 2, message: '缺少 start_time 字段' })
      return []
    }

    if (!isValidDateTime(date, startTime)) {
      errors.push({ row: index + 2, message: 'start_time 格式无效' })
      return []
    }

    if (endTime && !isValidDateTime(date, endTime)) {
      errors.push({ row: index + 2, message: 'end_time 格式无效' })
      return []
    }

    const recurrenceWeekdays = parseWeekdays(row.weekdays)
    const recurrenceWeeks = normalizeWeeksExpression(
      row.weeks?.trim() || extractWeeksExpression(row.description, row.location),
    )

    const event = normalizeEventRecord({
      ...buildDefaultEvent(),
      title,
      source: 'csv',
      timeMode: endTime ? 'range' : 'point',
      startAt: combineDateAndTime(date, startTime),
      endAt: endTime ? combineDateAndTime(date, endTime) : undefined,
      recurrenceType: repeatType === 'none' && recurrenceWeekdays.length > 0 ? 'weekly' : repeatType,
      recurrenceInterval: Number(row.repeat_interval) > 0 ? Number(row.repeat_interval) : 1,
      recurrenceWeekdays: recurrenceWeekdays.length > 0 ? recurrenceWeekdays : undefined,
      recurrenceWeeks,
      description: row.description?.trim() || undefined,
      location: row.location?.trim() || undefined,
      color: row.color?.trim() || undefined,
    })

    return [event]
  })

  if (parsed.errors.length > 0) {
    errors.push(
      ...parsed.errors.map(error => ({
        row: error.row ? error.row + 1 : undefined,
        message: error.message,
      })),
    )
  }

  return { events, errors }
}
