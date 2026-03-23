# Schedule ICS And Daily Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild schedule around today-only active events, proper ICS course-series import, editable saved schedules, adaptive refresh, and Widget.js reminder notifications.

**Architecture:** Keep the existing `ScheduleEventRecord` storage model, but add a stronger normalization layer for ICS that collapses raw VEVENT rows into course-series records with week anchors, parsed teacher/section metadata, and optional alarm offsets. The widget view becomes a compact today-focused timeline with no duplicated top summary card, while settings are reorganized into theme vs schedule sections and the manual form doubles as an edit form.

**Tech Stack:** Vue 3 + `<script setup>`, Vitest, dayjs, ical.js, rrule, Element Plus, `@widget-js/core` NotificationApi

---

### Task 1: Add failing tests for ICS course-series normalization

**Files:**
- Modify: `src/widgets/schedule/__tests__/schedule-io.test.ts`
- Create: `src/widgets/schedule/model/ics-course.ts`
- Modify: `src/widgets/schedule/importers/ics.ts`

**Step 1: Write failing tests**

- Add a test that imports a small ICS snippet containing multiple same-course VEVENT rows and expects one normalized event with:
  - `recurrenceType: 'weekly'`
  - normalized `recurrenceWeeks`
  - parsed `location`
  - description preserving teacher/section details
- Add a test that verifies `9-16周` does not get treated as weeks `1-8`.
- Add a test that verifies `VALARM TRIGGER:-PT10M` becomes a usable reminder offset on the stored event.

**Step 2: Run the targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-io.test.ts`

Expected: FAIL because the importer currently returns flat VEVENT rows and ignores alarm semantics.

**Step 3: Implement minimal ICS normalization**

- Add helper(s) that:
  - parse description into `teacher`, `sectionText`, `weeks`
  - derive stable course-series grouping key
  - compute a `recurrenceWeekStart` anchor from UID week markers or explicit week text
- Update `parseIcsEvents()` to group VEVENT rows into one stored course-series event where possible.

**Step 4: Re-run targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-io.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/widgets/schedule/__tests__/schedule-io.test.ts src/widgets/schedule/importers/ics.ts src/widgets/schedule/model/ics-course.ts
git commit -m "feat(schedule): normalize ics course series"
```

### Task 2: Add failing tests for today-only occurrence filtering

**Files:**
- Modify: `src/widgets/schedule/__tests__/schedule-model.test.ts`
- Modify: `src/widgets/schedule/model/occurrence.ts`
- Modify: `src/widgets/schedule/composables/useScheduleView.ts`

**Step 1: Write failing tests**

- Add a test that today list excludes already-ended events.
- Add a test that today list includes ongoing and upcoming events only.
- Add a test that summary no longer injects a duplicate display card when list is empty.

**Step 2: Run targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-model.test.ts`

Expected: FAIL because past-today events are still returned.

**Step 3: Implement minimal filtering**

- Add a filtered today occurrence selector for `ongoing || upcoming`.
- Preserve week expansion separately.
- Keep progress calculation based on current day occurrence only.

**Step 4: Re-run targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-model.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/widgets/schedule/__tests__/schedule-model.test.ts src/widgets/schedule/model/occurrence.ts src/widgets/schedule/composables/useScheduleView.ts
git commit -m "fix(schedule): show only active items for today"
```

### Task 3: Add failing tests for adaptive refresh and reminder scheduling

**Files:**
- Create: `src/widgets/schedule/__tests__/schedule-notification.test.ts`
- Modify: `src/widgets/schedule/composables/useScheduleNotifications.ts`
- Create: `src/widgets/schedule/model/refresh.ts`
- Modify: `src/widgets/schedule/model/types.ts`

**Step 1: Write failing tests**

- Add pure tests for next refresh delay:
  - default `10m`
  - `<10m` becomes `1m`
  - `<1m` becomes `10s`
- Add tests for reminder trigger window using:
  - explicit alarm offset from ICS
  - start notification
  - end notification

**Step 2: Run targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-notification.test.ts`

Expected: FAIL because no pure scheduling helper exists yet.

**Step 3: Implement minimal scheduling logic**

- Add alarm offset fields to the event model.
- Add pure helper(s) for adaptive polling and notification checkpoints.
- Refactor `useScheduleNotifications()` to use `setTimeout` recursion instead of fixed `setInterval`.

**Step 4: Re-run targeted test**

Run: `npm test -- src/widgets/schedule/__tests__/schedule-notification.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/widgets/schedule/__tests__/schedule-notification.test.ts src/widgets/schedule/composables/useScheduleNotifications.ts src/widgets/schedule/model/refresh.ts src/widgets/schedule/model/types.ts
git commit -m "feat(schedule): add adaptive refresh and reminders"
```

### Task 4: Rebuild compact widget layout and settings structure

**Files:**
- Modify: `src/widgets/schedule/ScheduleWidgetView.vue`
- Modify: `src/widgets/schedule/components/ScheduleHeader.vue`
- Modify: `src/widgets/schedule/components/ScheduleEventRow.vue`
- Modify: `src/widgets/schedule/components/ScheduleListView.vue`
- Modify: `src/widgets/schedule/ScheduleConfigView.vue`

**Step 1: Write/adjust presentation tests**

- Extend `schedule-presentation.test.ts` if needed for compact header behavior and toggle labeling.

**Step 2: Implement UI changes**

- Remove the large top “ongoing” card.
- Ensure the header respects widget inner padding and rounded bounds.
- Reorganize settings into `主题设置` and `日程设置`.
- Add sample `CSV` / `JSON` download buttons in settings.

**Step 3: Verify**

Run:
- `npm test -- src/widgets/schedule/__tests__/schedule-presentation.test.ts`
- `npm run typecheck`

Expected: PASS.

**Step 4: Commit**

```bash
git add src/widgets/schedule/ScheduleWidgetView.vue src/widgets/schedule/components/ScheduleHeader.vue src/widgets/schedule/components/ScheduleEventRow.vue src/widgets/schedule/components/ScheduleListView.vue src/widgets/schedule/ScheduleConfigView.vue src/widgets/schedule/__tests__/schedule-presentation.test.ts
git commit -m "fix(schedule): compact today layout and settings grouping"
```

### Task 5: Add editable saved schedules and sample exports

**Files:**
- Modify: `src/widgets/schedule/components/ScheduleManualEntryForm.vue`
- Modify: `src/widgets/schedule/ScheduleConfigView.vue`
- Modify: `src/widgets/schedule/composables/useScheduleImportExport.ts`
- Modify: `refer/demo.csv`
- Modify: `refer/demo.json`
- Modify: `spec/reqiremnts.md`

**Step 1: Implement edit flow**

- Add editable form state with `mode: create | edit`.
- Allow saved events to populate the form for editing.
- Keep deletion and update behavior in one place.

**Step 2: Implement sample downloads**

- Add explicit “下载示例 CSV” / “下载示例 JSON” actions in settings.
- Reference the same example files in requirements doc.

**Step 3: Verify**

Run:
- `npm run typecheck`
- `npm test`

Expected: PASS.

**Step 4: Commit**

```bash
git add src/widgets/schedule/components/ScheduleManualEntryForm.vue src/widgets/schedule/ScheduleConfigView.vue src/widgets/schedule/composables/useScheduleImportExport.ts refer/demo.csv refer/demo.json spec/reqiremnts.md
git commit -m "feat(schedule): support editing and sample downloads"
```

### Task 6: Full verification

**Files:**
- Review only

**Step 1: Run full verification**

Run:
- `npm test`
- `npm run typecheck`
- `npm run build`

Expected: all pass.

**Step 2: Inspect generated widget metadata**

Run:
- `cat public/widget.json`

Expected: only `schedule` widget is registered.

**Step 3: Report notification implementation**

- Cite Widget.js NotificationApi capability from local typings and official API index.
- Explain that this widget uses `NotificationApi.reminder()` with alarm/start/end checkpoints.
