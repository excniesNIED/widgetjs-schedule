import { NotificationApi } from '@widget-js/core'
import { onMounted, onUnmounted, type Ref } from 'vue'
import { dayjs, nowIsoString, toIsoString, toLocalTime } from '../model/date'
import { formatOccurrenceTime } from '../model/format'
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

async function sendToastNotification(title: string, message: string, duration: number) {
  await NotificationApi.reminder({
    title,
    message,
    duration,
  })
}

function buildDetailLines(occurrence: ScheduleOccurrence) {
  return [
    occurrence.description,
    occurrence.teacher ? `教师：${occurrence.teacher}` : '',
    occurrence.sectionText ? `节次：${occurrence.sectionText}` : '',
    occurrence.repeatLabel && occurrence.repeatLabel !== '单次' ? `重复：${occurrence.repeatLabel}` : '',
  ].filter(Boolean)
}

export function buildNotificationContent(kind: 'alarm' | 'start' | 'end', occurrence: ScheduleOccurrence) {
  const timeLabel = formatOccurrenceTime(occurrence)
  const detailLines = buildDetailLines(occurrence)

  if (kind === 'alarm') {
    return {
      title: '日程提醒',
      message: [
        `提醒：${occurrence.title}`,
        `时间：${timeLabel}`,
        ...detailLines,
      ].join('\n'),
    }
  }

  if (kind === 'start') {
    return {
      title: '日程开始',
      message: [
        `开始：${occurrence.title}`,
        `时间：${timeLabel}`,
        ...detailLines,
      ].join('\n'),
    }
  }

  return {
    title: '日程结束',
    message: [
      `结束：${occurrence.title}`,
      `时间：${toLocalTime(occurrence.startAt)}`,
      ...detailLines,
    ].join('\n'),
  }
}

export function useScheduleNotifications(
  events: Ref<ScheduleEventRecord[]>,
  settings: Ref<ScheduleWidgetSettings>,
  notificationLog: Ref<NotificationLog>,
  now: Ref<string>,
) {
  let timer: number | undefined

  async function sendNotification(title: string, message: string) {
    const { notificationTypes, toastDuration } = settings.value
    const promises: Promise<void>[] = []
    const types = notificationTypes ?? []

    if (types.includes('toast')) {
      promises.push(sendToastNotification(title, message, toastDuration))
    }

    if (types.includes('system')) {
      await ensureSystemNotificationPermission()
      promises.push(sendSystemNotification(title, message))
    }

    if (promises.length > 0) {
      const results = await Promise.allSettled(promises)
      if (results.every(result => result.status === 'rejected')) {
        console.error('Failed to send notification', results)
      }
    }
  }

  function getTodayOccurrences() {
    return expandEventsInRange({
      events: events.value,
      rangeStart: toIsoString(dayjs(now.value).startOf('day')),
      rangeEnd: toIsoString(dayjs(now.value).endOf('day')),
      now: now.value,
    })
  }

  async function checkNotifications(occurrences: ScheduleOccurrence[]) {
    const checkpoints = buildNotificationCheckpoints(occurrences, settings.value)
    const currentTime = dayjs(now.value)

    for (const checkpoint of checkpoints) {
      if (notificationLog.value[checkpoint.key]) {
        continue
      }

      const diffSeconds = currentTime.diff(dayjs(checkpoint.timestamp), 'second')
      if (diffSeconds < 0 || diffSeconds > 30) {
        continue
      }

      const payload = buildNotificationContent(checkpoint.kind, checkpoint.occurrence)
      await sendNotification(payload.title, payload.message)
      notificationLog.value = {
        ...notificationLog.value,
        [checkpoint.key]: true,
      }
    }

    return checkpoints
  }

  async function scheduleNextCheck() {
    now.value = nowIsoString()
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
