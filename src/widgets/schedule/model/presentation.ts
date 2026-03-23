import type {
  ScheduleSummary,
  ScheduleViewMode,
} from './types'

export type ScheduleHeaderBadge =
  | {
    kind: 'ongoing'
    title: string
  }
  | {
    kind: 'upcoming'
    title: string
  }
  | {
    kind: 'summary'
    title: string
    emphasis: string
  }

export interface ScheduleViewToggleAction {
  nextView: ScheduleViewMode
  label: string
  icon: 'calendar' | 'list'
}

export function getViewToggleAction(activeView: ScheduleViewMode): ScheduleViewToggleAction {
  if (activeView === 'list') {
    return {
      nextView: 'week',
      label: '切换到周视图',
      icon: 'calendar',
    }
  }

  return {
    nextView: 'list',
    label: '切换到今日列表',
    icon: 'list',
  }
}

export function getHeaderBadge(
  summary: ScheduleSummary,
  todayCount: number,
): ScheduleHeaderBadge | null {
  if (summary.current) {
    return {
      kind: 'ongoing',
      title: summary.current.title,
    }
  }

  if (summary.next) {
    return {
      kind: 'upcoming',
      title: summary.next.title,
    }
  }

  if (todayCount > 0) {
    return {
      kind: 'summary',
      title: `今日共 ${todayCount} 项`,
      emphasis: '以日程列表为主',
    }
  }

  return null
}
