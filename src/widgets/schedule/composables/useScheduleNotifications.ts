import { NotificationApi } from '@widget-js/core'
import { onMounted, onUnmounted, type Ref } from 'vue'
import { dayjs, toLocalTime } from '../model/date'
import { expandEventsInRange } from '../model/occurrence'
import { buildNotificationCheckpoints, getRecommendedRefreshDelay } from '../model/refresh'
import type {
  ScheduleEventRecord,
  ScheduleOccurrence,
  ScheduleWidgetSettings,
} from '../model/types'

type NotificationLog = Record<string, true>
const NOTIFICATION_POLL_INTERVAL = 15 * 1000

export async function ensureSystemNotificationPermission() {
  if (!('Notification' in globalThis)) {
    return 'unsupported'
  }

  if (globalThis.Notification.permission === 'default') {
    try {
      return await globalThis.Notification.requestPermission()
    }
    catch (error) {
      console.error('Failed to request system notification permission', error)
      return globalThis.Notification.permission
    }
  }

  return globalThis.Notification.permission
}

async function sendSystemNotification(title: string, message: string) {
  if (!('Notification' in globalThis) || globalThis.Notification.permission !== 'granted') {
    return
  }

  const notification = new globalThis.Notification(title, {
    body: message,
    tag: `schedule:${title}:${message}`,
  })

  window.setTimeout(() => {
    notification.close()
  }, 8000)
}

export function useScheduleNotifications(
  events: Ref<ScheduleEventRecord[]>,
  settings: Ref<ScheduleWidgetSettings>,
  notificationLog: Ref<NotificationLog>,
  now: Ref<string>,
) {
  let timer: number | undefined

  async function sendNotification(title: string, message: string) {
    const attempts = await Promise.allSettled([
      NotificationApi.reminder({
        title,
        message,
        duration: 6000,
        confirmButtonText: '知道了',
      }),
      sendSystemNotification(title, message),
    ])

    if (attempts.every(result => result.status === 'rejected')) {
      console.error('Failed to send notification', attempts)
    }
  }

  function getTodayOccurrences() {
    return expandEventsInRange({
      events: events.value,
      rangeStart: dayjs(now.value).startOf('day').toISOString(),
      rangeEnd: dayjs(now.value).endOf('day').toISOString(),
      now: now.value,
      settings: settings.value,
    })
  }

  function buildMessage(kind: 'alarm' | 'start' | 'end', occurrence: ScheduleOccurrence) {
    const timeLabel = toLocalTime(occurrence.startAt)
    const locationLabel = occurrence.location ? ` · ${occurrence.location}` : ''

    if (kind === 'alarm') {
      return {
        title: '当前进展',
        message: `提醒：${occurrence.title} 将于 ${timeLabel} 开始${locationLabel}`,
      }
    }

    if (kind === 'start') {
      return {
        title: '当前进展',
        message: `开始：${occurrence.title} · ${timeLabel}${locationLabel}`,
      }
    }

    return {
      title: '当前进展',
      message: `结束：${occurrence.title} 已结束`,
    }
  }

  async function checkNotifications(occurrences: ScheduleOccurrence[]) {
    const checkpoints = buildNotificationCheckpoints(occurrences, settings.value)
    const currentTime = dayjs(now.value)

    for (const checkpoint of checkpoints) {
      if (notificationLog.value[checkpoint.key]) {
        continue
      }

      const diffSeconds = currentTime.diff(dayjs(checkpoint.timestamp), 'second')
      if (diffSeconds < 0 || diffSeconds > 15) {
        continue
      }

      const payload = buildMessage(checkpoint.kind, checkpoint.occurrence)
      await sendNotification(payload.title, payload.message)
      notificationLog.value = {
        ...notificationLog.value,
        [checkpoint.key]: true,
      }
    }

    return checkpoints
  }

  async function scheduleNextCheck() {
    now.value = new Date().toISOString()
    const occurrences = getTodayOccurrences()
    const checkpoints = await checkNotifications(occurrences)
    const delay = getRecommendedRefreshDelay(
      [
        ...checkpoints.map(item => item.timestamp),
        ...occurrences.flatMap(occurrence => [
          occurrence.startAt,
          occurrence.endAt,
        ].filter(Boolean) as string[]),
      ],
      now.value,
      {
        hasOngoing: occurrences.some(item => item.isOngoing),
      },
    )
    timer = window.setTimeout(() => {
      void scheduleNextCheck()
    }, Math.min(delay, NOTIFICATION_POLL_INTERVAL))
  }

  onMounted(() => {
    void scheduleNextCheck()
  })

  onUnmounted(() => {
    if (timer) {
      window.clearTimeout(timer)
    }
  })
}
