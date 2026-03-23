import { describe, expect, it } from 'vitest'
import { buildDefaultEvent } from '../model/defaults'
import { mergeImportedEvents } from '../model/import'
import type { ScheduleEventRecord } from '../model/types'

function buildEvent(partial: Partial<ScheduleEventRecord>): ScheduleEventRecord {
  return {
    ...buildDefaultEvent(),
    ...partial,
  }
}

describe('schedule import merge', () => {
  it('replaces existing events from the same imported source', () => {
    const existing = [
      buildEvent({
        id: 'manual-1',
        source: 'manual',
        title: '手动事项',
        updatedAt: '2026-03-23T10:00:00+08:00',
      }),
      buildEvent({
        id: 'ics-old-1',
        source: 'ics',
        title: '操作系统-旧',
        updatedAt: '2026-03-23T09:00:00+08:00',
      }),
      buildEvent({
        id: 'ics-old-2',
        source: 'ics',
        title: '操作系统-旧-2',
        updatedAt: '2026-03-23T09:30:00+08:00',
      }),
    ]

    const imported = [
      buildEvent({
        id: 'ics-new-1',
        source: 'ics',
        title: '操作系统',
        updatedAt: '2026-03-23T11:00:00+08:00',
      }),
    ]

    const merged = mergeImportedEvents(existing, imported)

    expect(merged.map(event => event.id)).toEqual(['ics-new-1', 'manual-1'])
  })
})
