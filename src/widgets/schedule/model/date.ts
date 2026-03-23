import baseDayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import isoWeek from 'dayjs/plugin/isoWeek'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

baseDayjs.extend(customParseFormat)
baseDayjs.extend(duration)
baseDayjs.extend(isoWeek)
baseDayjs.extend(localizedFormat)
baseDayjs.extend(utc)
baseDayjs.extend(timezone)

export const APP_TIMEZONE = 'Asia/Shanghai'
baseDayjs.tz.setDefault(APP_TIMEZONE)

export function toDayjs(value: string | Date | baseDayjs.Dayjs) {
  if (baseDayjs.isDayjs(value)) {
    return value.tz(APP_TIMEZONE)
  }

  if (typeof value === 'string') {
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
      return baseDayjs.tz(value, APP_TIMEZONE)
    }

    return baseDayjs(value).tz(APP_TIMEZONE)
  }

  return baseDayjs(value).tz(APP_TIMEZONE)
}

export const dayjs = Object.assign(
  (value?: string | Date | baseDayjs.Dayjs) =>
    value === undefined ? baseDayjs.tz(APP_TIMEZONE) : toDayjs(value),
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
  return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', APP_TIMEZONE).format('YYYY-MM-DDTHH:mm:ssZ')
}

export function isValidDateTime(date: string, time: string) {
  return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', APP_TIMEZONE).isValid()
}

export function nowInTimezone() {
  return dayjs().tz(APP_TIMEZONE)
}

export function nowIsoString() {
  return nowInTimezone().format('YYYY-MM-DDTHH:mm:ssZ')
}
