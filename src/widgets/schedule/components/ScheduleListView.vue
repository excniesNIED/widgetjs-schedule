<script setup lang="ts">
import type {
  ScheduleListBackgroundMode,
  ScheduleOccurrence,
} from '../model/types'
import ScheduleEmptyState from './ScheduleEmptyState.vue'
import ScheduleEventRow from './ScheduleEventRow.vue'

defineProps<{
  occurrences: ScheduleOccurrence[]
  now: string
  backgroundMode: ScheduleListBackgroundMode
}>()
</script>

<template>
  <div v-if="occurrences.length > 0" class="list-view">
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
    title="今天暂无日程"
    description="去设置页手动添加或导入 CSV / JSON / ICS。"
  />
</template>

<style scoped>
.list-view {
  display: grid;
  gap: 0.68rem;
}
</style>
