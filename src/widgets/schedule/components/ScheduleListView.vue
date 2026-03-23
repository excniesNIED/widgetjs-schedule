<script setup lang="ts">
import type { ScheduleListBackgroundMode, ScheduleOccurrence } from '../model/types'
import ScheduleEmptyState from './ScheduleEmptyState.vue'
import ScheduleEventRow from './ScheduleEventRow.vue'

withDefaults(defineProps<{
  occurrences: ScheduleOccurrence[]
  now: string
  backgroundMode: ScheduleListBackgroundMode
  density?: 'compact' | 'standard' | 'large'
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
    />
  </div>
  <ScheduleEmptyState
    v-else
    title=""
    description="去设置页添加或导入日程。"
    compact
  />
</template>

<style scoped>
.list-view {
  display: grid;
  gap: 0.68rem;
}

.list-view.compact {
  gap: 0.48rem;
}

.list-view.large {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
}

@media (max-width: 920px) {
  .list-view.large {
    grid-template-columns: 1fr;
  }
}
</style>
