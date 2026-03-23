import baseDayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import isoWeek from 'dayjs/plugin/isoWeek'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import utc from 'dayjs/plugin/utc'

baseDayjs.extend(customParseFormat)
baseDayjs.extend(duration)
baseDayjs.extend(isoWeek)
baseDayjs.extend(localizedFormat)
baseDayjs.extend(utc)

export const APP_TIMEZONE = 'Asia/Shanghai'
const APP_UTC_OFFSET_MINUTES = 8 * 60
const HAS_EXPLICIT_ZONE_RE = /[zZ]|[+-]\d{2}:?\d{2}$/

export function toDayjs(value: string | Date | baseDayjs.Dayjs) {
  if (baseDayjs.isDayjs(value)) {
    return value.utcOffset(APP_UTC_OFFSET_MINUTES)
  }

  if (typeof value === 'string') {
    if (!HAS_EXPLICIT_ZONE_RE.test(value)) {
      return baseDayjs(value).utcOffset(APP_UTC_OFFSET_MINUTES, true)
    }

    return baseDayjs(value).utcOffset(APP_UTC_OFFSET_MINUTES)
  }

  return baseDayjs(value).utcOffset(APP_UTC_OFFSET_MINUTES)
}

export const dayjs = Object.assign(
  (value?: string | Date | baseDayjs.Dayjs) =>
    value === undefined ? baseDayjs().utcOffset(APP_UTC_OFFSET_MINUTES) : toDayjs(value),
  baseDayjs,
) as typeof baseDayjs

export function toIsoString(value: string | Date | baseDayjs.Dayjs) {
  return toDayjs(value).format('YYYY-MM-DDTHH:mm:ssZ')
}

export function toLocalDate(value: string | Date | baseDayjs.Dayjs) {
  return toDayjs(value).format('YYYY-MM-DD')
}

export function toLocalTime(value: string | Date | baseDayjs.Dayjs) {
  return toDayjs(value).format('HH:mm')
}

export function toWeekdayNumber(value: string | Date | baseDayjs.Dayjs) {
  return toDayjs(value).isoWeekday()
}

export function combineDateAndTime(date: string, time: string) {
  return baseDayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm', true)
    .utcOffset(APP_UTC_OFFSET_MINUTES, true)
    .format('YYYY-MM-DDTHH:mm:ssZ')
}

export function isValidDateTime(date: string, time: string) {
  return baseDayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm', true).isValid()
}

export function nowInTimezone() {
  return baseDayjs().utcOffset(APP_UTC_OFFSET_MINUTES)
}

export function nowIsoString() {
  return nowInTimezone().format('YYYY-MM-DDTHH:mm:ssZ')
}
