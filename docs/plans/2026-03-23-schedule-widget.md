# Schedule Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready `schedule` widget inside the Widget.js template with local event storage, list/week views, configurable colors, notifications, and ICS/CSV/JSON import/export.

**Architecture:** Add a self-contained `src/widgets/schedule/` module in the template. Keep view components thin by moving date expansion, recurrence labels, persistence, import/export, and notification scheduling into composables and model utilities so the widget view only renders normalized occurrence data.

**Tech Stack:** Vue 3 + `<script setup lang="ts">`, Widget.js Vue3 plugin, VueUse storage helpers, Element Plus form controls, `rrule`, `papaparse`, `ical.js`, `dayjs`, `vitest`

---

### Task 1: Wire template dependencies and entry points

**Files:**
- Modify: `template/package.json`
- Modify: `template/widget.package.ts`
- Modify: `template/src/widgets/widget-router.ts`
- Create: `template/public/preview_schedule.png`

**Step 1: Update widget template dependencies**

Add runtime libraries for recurrence, parsing, and date formatting. Add `vitest` to template dev dependencies for future template-local tests.

**Step 2: Register schedule widget entry points**

Update package metadata and widget router so the template exposes both the example clock widget and the new schedule widget.

**Step 3: Verify package metadata compiles conceptually**

Run: `npm install`
Expected: install finishes without dependency resolution errors.

### Task 2: Build schedule domain model and storage

**Files:**
- Create: `template/src/widgets/schedule/model/types.ts`
- Create: `template/src/widgets/schedule/model/defaults.ts`
- Create: `template/src/widgets/schedule/model/storage.ts`
- Create: `template/src/widgets/schedule/model/recurrence.ts`
- Create: `template/src/widgets/schedule/model/occurrence.ts`
- Create: `template/src/widgets/schedule/model/format.ts`

**Step 1: Write failing tests for recurrence expansion and labels**

Add tests covering:
- single event expansion
- daily / weekdays / weekend expansion
- custom RRULE expansion
- repeat label formatting
- ongoing / upcoming status derivation

**Step 2: Run tests to verify red**

Run: `npm run test -- --run`
Expected: failures because schedule model files do not exist yet.

**Step 3: Implement minimal model layer**

Create normalized event/settings types, default settings, storage keys, recurrence helpers, occurrence expansion, and display label formatters.

**Step 4: Run tests to verify green**

Run: `npm run test -- --run`
Expected: recurrence and formatting tests pass.

### Task 3: Implement import/export adapters

**Files:**
- Create: `template/src/widgets/schedule/importers/csv.ts`
- Create: `template/src/widgets/schedule/importers/json.ts`
- Create: `template/src/widgets/schedule/importers/ics.ts`
- Create: `template/src/widgets/schedule/exporters/csv.ts`
- Create: `template/src/widgets/schedule/exporters/json.ts`
- Create: `template/src/widgets/schedule/exporters/ics.ts`
- Create: `template/src/widgets/schedule/model/file.ts`
- Create: `template/src/widgets/schedule/__tests__/schedule-io.test.ts`

**Step 1: Write failing tests for import/export**

Cover:
- CSV header parsing and week extraction
- JSON validation
- ICS parse of SUMMARY / DTSTART / DTEND / RRULE
- CSV / JSON / ICS export round-trip expectations

**Step 2: Run tests to verify red**

Run: `npm run test -- --run`
Expected: IO tests fail because adapters are missing.

**Step 3: Implement adapters**

Build import/export helpers that convert external payloads to `ScheduleEventRecord[]` and serializable download blobs.

**Step 4: Run tests to verify green**

Run: `npm run test -- --run`
Expected: model and IO tests pass.

### Task 4: Build widget composables and notifications

**Files:**
- Create: `template/src/widgets/schedule/composables/useScheduleStore.ts`
- Create: `template/src/widgets/schedule/composables/useScheduleView.ts`
- Create: `template/src/widgets/schedule/composables/useScheduleNotifications.ts`
- Create: `template/src/widgets/schedule/composables/useScheduleImportExport.ts`
- Create: `template/src/widgets/schedule/__tests__/schedule-store.test.ts`

**Step 1: Write failing tests for store behavior**

Cover:
- adding manual events
- updating colors/settings
- deriving today/week occurrences
- notification de-duplication log updates

**Step 2: Run tests to verify red**

Run: `npm run test -- --run`
Expected: store tests fail.

**Step 3: Implement composables**

Keep all persistence through `useStorage`, derive current/next event summaries, and schedule periodic notification checks.

**Step 4: Run tests to verify green**

Run: `npm run test -- --run`
Expected: store tests pass with previous suites still green.

### Task 5: Build schedule widget UI

**Files:**
- Create: `template/src/widgets/schedule/Schedule.widget.ts`
- Create: `template/src/widgets/schedule/ScheduleWidgetRoutes.ts`
- Create: `template/src/widgets/schedule/ScheduleWidgetView.vue`
- Create: `template/src/widgets/schedule/ScheduleConfigView.vue`
- Create: `template/src/widgets/schedule/components/ScheduleHeader.vue`
- Create: `template/src/widgets/schedule/components/ScheduleListView.vue`
- Create: `template/src/widgets/schedule/components/ScheduleWeekView.vue`
- Create: `template/src/widgets/schedule/components/ScheduleEventRow.vue`
- Create: `template/src/widgets/schedule/components/ScheduleWeekColumn.vue`
- Create: `template/src/widgets/schedule/components/ScheduleEmptyState.vue`
- Create: `template/src/widgets/schedule/components/ScheduleManualEntryForm.vue`
- Modify: `template/src/assets/main.css`

**Step 1: Implement widget metadata and routes**

Expose `4x3` / `4x4` / `8x8` sizing via min/default/max and enable `NORMAL | OVERLAP`.

**Step 2: Implement the widget view**

Render summary header, list/week view switch, density-specific layout, timeline marker, and progress/countdown fills while staying inside `widget-wrapper`.

**Step 3: Implement the config view**

Use `WidgetEditDialog` and `WidgetConfigOption`, expose theme controls, color controls, import/export buttons, and manual add/edit flows.

**Step 4: Run type/build verification**

Run: `npm run build`
Expected: template build succeeds.

### Task 6: Verify the final template behavior

**Files:**
- Verify only

**Step 1: Run template test suite**

Run: `npm run test -- --run`
Expected: all schedule tests pass.

**Step 2: Run template build**

Run: `npm run build`
Expected: Vite build succeeds.

**Step 3: Check output against spec**

Verify:
- schedule widget registered
- both list/week views render
- ICS/CSV/JSON import/export actions are present
- colors and theme options are exposed
- notification logic is wired with de-duplication
