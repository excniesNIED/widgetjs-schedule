import { exportEventsToCsv } from '../exporters/csv'
import { exportEventsToIcs } from '../exporters/ics'
import { exportEventsToJson } from '../exporters/json'
import { parseCsvEvents } from '../importers/csv'
import { parseIcsEvents } from '../importers/ics'
import { parseJsonEvents } from '../importers/json'
import type { ScheduleEventRecord } from '../model/types'

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function useScheduleImportExport() {
  async function importByFile(file: File) {
    const content = await file.text()
    const lowerName = file.name.toLowerCase()

    if (lowerName.endsWith('.csv')) {
      return parseCsvEvents(content)
    }

    if (lowerName.endsWith('.json')) {
      return {
        events: parseJsonEvents(content),
        errors: [],
      }
    }

    if (lowerName.endsWith('.ics')) {
      return {
        events: parseIcsEvents(content),
        errors: [],
      }
    }

    throw new Error('仅支持导入 .csv、.json、.ics 文件')
  }

  function exportByType(type: 'csv' | 'json' | 'ics', events: ScheduleEventRecord[]) {
    if (type === 'csv') {
      downloadTextFile(
        'schedule-export.csv',
        exportEventsToCsv(events),
        'text/csv;charset=utf-8',
      )
      return
    }

    if (type === 'json') {
      downloadTextFile(
        'schedule-export.json',
        exportEventsToJson(events),
        'application/json;charset=utf-8',
      )
      return
    }

    downloadTextFile(
      'schedule-export.ics',
      exportEventsToIcs(events),
      'text/calendar;charset=utf-8',
    )
  }

  return {
    importByFile,
    exportByType,
  }
}
