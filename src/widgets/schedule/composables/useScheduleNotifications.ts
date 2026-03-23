import { NotificationApi } from '@widget-js/core'
import { onMounted, onUnmounted, type Ref } from 'vue'
import { dayjs } from '../model/date'
import { expandEventsInRange } from '../model/occurrence'
import type {
  ScheduleEventRecord,
  ScheduleWidgetSettings,
} from '../model/types'

type NotificationLog = Record<string, { started?: boolean, ended?: boolean }>

export function useScheduleNotifications(
  events: Ref<ScheduleEventRecord[]>,
  settings: Ref<ScheduleWidgetSettings>,
  notificationLog: Ref<NotificationLog>,
  now: Ref<string>,
) {
  let timer: number | undefined

  async function sendNotification(title: string, message: string) {
    try {
      await NotificationApi.reminder({
        title,
        message,
        duration: 6000,
        confirmButtonText: '知道了',
      })
    }
    catch (error) {
      console.error('Failed to send notification', error)
    }
  }

  async function checkNotifications() {
    const occurrences = expandEventsInRange({
      events: events.value,
      rangeStart: dayjs(now.value).subtract(1, 'day').toISOString(),
      rangeEnd: dayjs(now.value).add(1, 'day').toISOString(),
      now: now.value,
      settings: settings.value,
    })
    const currentTime = dayjs(now.value)

    for (const occurrence of occurrences) {
      const start = dayjs(occurrence.startAt)
      const end = occurrence.endAt ? dayjs(occurrence.endAt) : undefined
      const log = notificationLog.value[occurrence.occurrenceKey] ?? {}

      if (!log.started && currentTime.diff(start, 'second') >= 0 && currentTime.diff(start, 'second') <= 15) {
        await sendNotification('日程开始', `${occurrence.title} · ${occurrence.startAt.slice(11, 16)}`)
        log.started = true
      }

      if (
        end
        && !log.ended
        && currentTime.diff(end, 'second') >= 0
        && currentTime.diff(end, 'second') <= 15
      ) {
        await sendNotification('日程结束', `${occurrence.title} 已结束`)
        log.ended = true
      }

      if (log.started || log.ended) {
        notificationLog.value = {
          ...notificationLog.value,
          [occurrence.occurrenceKey]: log,
        }
      }
    }
  }

  onMounted(() => {
    timer = window.setInterval(() => {
      void checkNotifications()
    }, 15_000)
    void checkNotifications()
  })

  onUnmounted(() => {
    if (timer) {
      window.clearInterval(timer)
    }
  })
}
