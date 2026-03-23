import { normalizeEventRecord } from '../model/normalize'
import type { ScheduleEventRecord } from '../model/types'

export function parseJsonEvents(json: string): ScheduleEventRecord[] {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) {
    throw new Error('JSON 顶层必须为数组')
  }

  return parsed.map((item) => {
    if (!item?.title || !item?.startAt) {
      throw new Error('JSON 事件缺少 title 或 startAt')
    }

    return normalizeEventRecord(item, 'json')
  })
}
