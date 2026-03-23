import { describe, expect, it } from 'vitest'
import type { ScheduleSummary, ScheduleViewMode } from '../model/types'
import {
  getHeaderBadge,
  getViewToggleAction,
} from '../model/presentation'

function buildSummary(partial: Partial<ScheduleSummary>): ScheduleSummary {
  return {
    ...partial,
  }
}

describe('schedule presentation helpers', () => {
  it('returns the opposite view as the toggle action', () => {
    expect(getViewToggleAction('list' satisfies ScheduleViewMode)).toEqual({
      nextView: 'week',
      label: '切换到周视图',
      icon: 'calendar',
    })

    expect(getViewToggleAction('week' satisfies ScheduleViewMode)).toEqual({
      nextView: 'list',
      label: '切换到今日列表',
      icon: 'list',
    })
  })

  it('hides the header badge when there is no current, next or today item', () => {
    expect(getHeaderBadge(buildSummary({}), 0)).toBeNull()
  })

  it('shows a count badge when today has items but no active summary', () => {
    expect(getHeaderBadge(buildSummary({}), 2)).toEqual({
      kind: 'summary',
      title: '今日共 2 项',
      emphasis: '以日程列表为主',
    })
  })

  it('prioritizes current and next occurrences over the count badge', () => {
    expect(
      getHeaderBadge(
        buildSummary({
          current: {
            eventId: '1',
            occurrenceKey: '1',
            title: '课程中',
            startAt: '2026-03-23T10:00:00+08:00',
            endAt: '2026-03-23T11:00:00+08:00',
            timeMode: 'range',
            isOngoing: true,
            isUpcoming: false,
            isPast: false,
            repeatLabel: '每周重复',
            colorToken: '#fff',
            progressColorToken: '#000',
            source: 'manual',
          },
        }),
        4,
      ),
    ).toEqual({
      kind: 'ongoing',
      title: '课程中',
    })

    expect(
      getHeaderBadge(
        buildSummary({
          next: {
            eventId: '2',
            occurrenceKey: '2',
            title: '下一节',
            startAt: '2026-03-23T11:30:00+08:00',
            endAt: '2026-03-23T12:00:00+08:00',
            timeMode: 'range',
            isOngoing: false,
            isUpcoming: true,
            isPast: false,
            repeatLabel: '每周重复',
            colorToken: '#fff',
            progressColorToken: '#000',
            source: 'manual',
          },
        }),
        4,
      ),
    ).toEqual({
      kind: 'upcoming',
      title: '下一节',
    })
  })
})
