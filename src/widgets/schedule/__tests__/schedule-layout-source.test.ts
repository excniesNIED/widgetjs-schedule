import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const widgetViewSource = readFileSync(
  resolve(import.meta.dirname, '../ScheduleWidgetView.vue'),
  'utf-8',
)
const mainCssSource = readFileSync(
  resolve(import.meta.dirname, '../../../assets/main.css'),
  'utf-8',
)
const listViewSource = readFileSync(
  resolve(import.meta.dirname, '../components/ScheduleListView.vue'),
  'utf-8',
)
const eventRowSource = readFileSync(
  resolve(import.meta.dirname, '../components/ScheduleEventRow.vue'),
  'utf-8',
)
const manualFormSource = readFileSync(
  resolve(import.meta.dirname, '../components/ScheduleManualEntryForm.vue'),
  'utf-8',
)

describe('schedule widget layout source', () => {
  it('keeps the header outside the scroll container and hides the internal scrollbar', () => {
    const headerIndex = widgetViewSource.indexOf('<header class="schedule-header">')
    const bodyIndex = widgetViewSource.indexOf('<main class="schedule-content">')
    const listContainerIndex = widgetViewSource.indexOf('<div class="list-container">')

    expect(headerIndex).toBeGreaterThan(-1)
    expect(bodyIndex).toBeGreaterThan(headerIndex)
    expect(listContainerIndex).toBeGreaterThan(bodyIndex)
    expect(widgetViewSource).toContain('overflow-y: auto;')
    expect(widgetViewSource).toContain('scrollbar-width: none;')
    expect(widgetViewSource).toContain('.list-container::-webkit-scrollbar')
  })

  it('keeps the widget shell inside the host bounds without absolute overflow positioning', () => {
    const widgetShellBlock = widgetViewSource.match(/\.widget-shell\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(widgetShellBlock).toContain('position: relative;')
    expect(widgetShellBlock).not.toContain('position: absolute;')
    expect(widgetViewSource).toContain('display: flex;')
    expect(widgetViewSource).toContain('flex-direction: column;')
    expect(widgetViewSource).toContain('max-height: 100%;')
    expect(widgetViewSource).toContain('overflow: hidden;')
    expect(mainCssSource).toContain('html,')
    expect(mainCssSource).toContain('#app')
    expect(mainCssSource).toContain('height: 100%;')
    expect(mainCssSource).toContain('overflow: hidden;')
  })

  it('uses a dedicated scroll container and clips progress backgrounds inside each card', () => {
    expect(widgetViewSource).toContain('.list-container')
    expect(widgetViewSource).toContain('flex: 1 1 auto;')
    expect(widgetViewSource).toContain('overflow-y: auto;')
    expect(widgetViewSource).toContain('padding: 0 2px 14px;')
    expect(listViewSource).toContain('align-items: stretch;')
    expect(listViewSource).toContain('overflow: clip;')
    expect(eventRowSource).toContain('position: relative;')
    expect(eventRowSource).toContain('overflow: hidden;')
    expect(eventRowSource).toContain('top: 0;')
    expect(eventRowSource).toContain('left: 0;')
    expect(eventRowSource).toContain('height: 100%;')
    expect(eventRowSource).toContain('width: min(100%, var(--progress-width, 0%));')
    expect(manualFormSource).not.toContain('地点')
  })
})
