import type { ScheduleNotificationType } from './types'

const DEFAULT_TOAST_DURATION_MS = 5000

export function shouldShowToastDurationInput(types: ScheduleNotificationType[]) {
  return types.includes('toast')
}

export function getToastDurationSeconds(durationMs?: number) {
  return Math.max(Math.round((durationMs ?? DEFAULT_TOAST_DURATION_MS) / 1000), 1)
}

export function toToastDurationMilliseconds(durationSeconds: number) {
  return Math.max(durationSeconds, 1) * 1000
}
