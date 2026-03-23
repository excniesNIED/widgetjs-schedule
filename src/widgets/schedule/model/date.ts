import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration from 'dayjs/plugin/duration'
import isoWeek from 'dayjs/plugin/isoWeek'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(customParseFormat)
dayjs.extend(duration)
dayjs.extend(isoWeek)
dayjs.extend(localizedFormat)

export { dayjs }

export function toDayjs(value: string | Date | dayjs.Dayjs) {
  return dayjs(value)
}

export function toIsoString(value: string | Date | dayjs.Dayjs) {
  return toDayjs(value).toISOString()
}

export function toLocalDate(value: string | Date | dayjs.Dayjs) {
  return toDayjs(value).format('YYYY-MM-DD')
}

export function toLocalTime(value: string | Date | dayjs.Dayjs) {
  return toDayjs(value).format('HH:mm')
}

export function toWeekdayNumber(value: string | Date | dayjs.Dayjs) {
  return toDayjs(value).isoWeekday()
}

export function combineDateAndTime(date: string, time: string) {
  return dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm', true).toISOString()
}

export function isValidDateTime(date: string, time: string) {
  return dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm', true).isValid()
}
