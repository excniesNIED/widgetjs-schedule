<script setup lang="ts">
import type { ScheduleListBackgroundMode, ScheduleOccurrence } from '../model/types'
import ScheduleEmptyState from './ScheduleEmptyState.vue'
import ScheduleEventRow from './ScheduleEventRow.vue'

withDefaults(defineProps<{
  occurrences: ScheduleOccurrence[]
  now: string
  backgroundMode: ScheduleListBackgroundMode
  density?: 'compact' | 'standard' | 'large'
  pointEventDurationMinutes?: number
}>(), {
  occurrences: () => [],
  density: 'standard',
})
</script>

<template>
  <div v-if="occurrences.length > 0" class="list-view" :class="density">
    <ScheduleEventRow
      v-for="occurrence in occurrences"
      :key="occurrence.occurrenceKey"
      :occurrence="occurrence"
      :now="now"
      :background-mode="backgroundMode"
      :point-event-duration-minutes="pointEventDurationMinutes"
    />
  </div>
  <ScheduleEmptyState
    v-else
    title="今天暂无日程"
    description="去添加或导入日程。"
  />
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--schedule-list-gap, 6px);
  width: 215px;
  max-width: 215px;
  margin-inline: auto;
  min-width: 0;
  min-height: 0;
}

.list-view.compact {
  gap: var(--schedule-list-gap-compact, 6px);
}

.list-view.large {
  gap: var(--schedule-list-gap-large, 6px);
}
</style>
