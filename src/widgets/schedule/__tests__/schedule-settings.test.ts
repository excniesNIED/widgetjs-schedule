import { describe, expect, it } from 'vitest'
import {
  getToastDurationSeconds,
  shouldShowToastDurationInput,
  toToastDurationMilliseconds,
} from '../model/notification-settings'

describe('schedule notification settings helpers', () => {
  it('shows toast duration input only when toast notifications are enabled', () => {
    expect(shouldShowToastDurationInput(['toast'])).toBe(true)
    expect(shouldShowToastDurationInput(['system'])).toBe(false)
    expect(shouldShowToastDurationInput(['toast', 'system'])).toBe(true)
  })

  it('converts toast duration between seconds in UI and milliseconds in storage', () => {
    expect(getToastDurationSeconds(5000)).toBe(5)
    expect(toToastDurationMilliseconds(5)).toBe(5000)
  })
})
