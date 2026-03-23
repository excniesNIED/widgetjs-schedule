<script setup lang="ts">
import { computed } from 'vue'
import { toLocalDate, toLocalTime } from '../model/date'
import { formatOccurrenceTime, formatShortDateLabel, formatWeekdayLabel } from '../model/format'
import type { ScheduleOccurrence } from '../model/types'
import ScheduleEmptyState from './ScheduleEmptyState.vue'

interface WeekColumn {
  date: string
  occurrences: ScheduleOccurrence[]
}

const props = withDefaults(defineProps<{
  columns: WeekColumn[]
  density: 'compact' | 'standard' | 'large'
  now: string
  showTimeline: boolean
}>(), {
  columns: () => [],
  density: 'standard',
})

const totalCount = computed(() =>
  props.columns.reduce((count, column) => count + column.occurrences.length, 0),
)
</script>

<template>
  <div v-if="totalCount > 0" class="week-grid" :class="density">
    <section
      v-for="column in columns"
      :key="column.date"
      class="day-column"
    >
      <header class="day-head">
        <div class="head-top">
          <strong>{{ formatWeekdayLabel(column.date) }}</strong>
          <span>{{ formatShortDateLabel(column.date) }}</span>
        </div>
        <em v-if="showTimeline && toLocalDate(column.date) === toLocalDate(now)">
          {{ toLocalTime(now) }}
        </em>
      </header>
      <div
        v-if="column.occurrences.length > 0"
        class="cards"
      >
        <article
          v-for="occurrence in column.occurrences"
          :key="occurrence.occurrenceKey"
          class="card"
          :class="{ ongoing: occurrence.isOngoing, upcoming: occurrence.isUpcoming }"
          :style="{ background: `linear-gradient(135deg, ${occurrence.colorToken}, rgba(255,255,255,0.82))` }"
        >
          <strong>{{ occurrence.title }}</strong>
          <span>{{ formatOccurrenceTime(occurrence) }}</span>
          <small v-if="density === 'large' && occurrence.description">
            {{ occurrence.description }}
          </small>
        </article>
      </div>
      <div
        v-else
        class="empty-day"
      >
        无日程
      </div>
    </section>
  </div>
  <ScheduleEmptyState
    v-else
    title="本周暂无日程"
    description="去设置页添加或导入日程。"
  />
</template>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.6rem;
}

.day-column {
  display: grid;
  gap: 0.42rem;
  min-width: 0;
}

.day-head {
  display: grid;
  gap: 0.18rem;
  padding-bottom: 0.34rem;
  border-bottom: 1px solid color-mix(in srgb, var(--widget-color) 12%, transparent);
}

.head-top {
  display: flex;
  justify-content: space-between;
  gap: 0.35rem;
  align-items: baseline;
}

.day-column strong {
  color: var(--widget-color);
  font-size: 0.88rem;
}

.day-column span,
.day-column em {
  font-style: normal;
  font-size: 0.74rem;
  color: color-mix(in srgb, var(--widget-color) 68%, transparent);
}

.cards {
  display: grid;
  gap: 0.42rem;
}

.card {
  display: grid;
  gap: 0.18rem;
  padding: 0.58rem;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--widget-color) 12%, transparent);
  min-height: 4.4rem;
  align-content: start;
}

.card strong {
  font-size: 0.82rem;
  line-height: 1.35;
}

.card span,
.card small {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--widget-color) 72%, transparent);
  line-height: 1.35;
}

.card small {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card.ongoing {
  box-shadow: 0 0 0 1px color-mix(in srgb, #ce6a4b 22%, transparent);
}

.card.upcoming {
  box-shadow: 0 0 0 1px color-mix(in srgb, #4b7a87 20%, transparent);
}

.empty-day {
  padding: 0.7rem 0.55rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--widget-background-color) 92%, white);
  color: color-mix(in srgb, var(--widget-color) 58%, transparent);
  font-size: 0.74rem;
}

.compact .card {
  min-height: 3.6rem;
}

.large .card {
  min-height: 3.85rem;
  padding: 0.46rem 0.5rem;
}

.large .day-column {
  gap: 0.34rem;
}

.large .day-column strong {
  font-size: 0.78rem;
}

.large .day-column span,
.large .day-column em {
  font-size: 0.66rem;
}

.large .cards {
  gap: 0.3rem;
}

.large .card strong {
  font-size: 0.72rem;
  line-height: 1.28;
}

.large .card span,
.large .card small {
  font-size: 0.64rem;
  line-height: 1.28;
}

@media (max-width: 920px) {
  .week-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
