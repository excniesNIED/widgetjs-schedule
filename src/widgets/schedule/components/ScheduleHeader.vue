<script setup lang="ts">
import { formatOccurrenceTime } from '../model/format'
import type { ScheduleOccurrence } from '../model/types'

defineProps<{
  dateLabel: string
  current?: ScheduleOccurrence
  next?: ScheduleOccurrence
}>()
</script>

<template>
  <header class="header">
    <div>
      <p class="eyebrow">今日节奏</p>
      <h1>{{ dateLabel }}</h1>
    </div>
    <div class="meta">
      <div
        v-if="current"
        class="pill ongoing"
      >
        <span>进行中</span>
        <strong>{{ current.title }}</strong>
        <small>{{ formatOccurrenceTime(current) }}</small>
      </div>
      <div
        v-else-if="next"
        class="pill upcoming"
      >
        <span>下一项</span>
        <strong>{{ next.title }}</strong>
        <small>{{ formatOccurrenceTime(next) }}</small>
      </div>
      <div
        v-else
        class="pill idle"
      >
        <span>今天暂无进行中的日程</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--widget-color) 60%, transparent);
}

h1 {
  margin: 0.18rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--widget-color);
}

.meta {
  display: flex;
  justify-content: flex-end;
}

.pill {
  min-width: 10rem;
  display: grid;
  gap: 0.12rem;
  padding: 0.55rem 0.7rem;
  border-radius: 1rem;
  color: var(--widget-color);
  background: color-mix(in srgb, var(--widget-background-color) 74%, white);
  border: 1px solid color-mix(in srgb, var(--widget-color) 12%, transparent);
}

.pill span {
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--widget-color) 68%, transparent);
}

.pill strong {
  font-size: 0.9rem;
}

.pill small {
  font-size: 0.78rem;
}

.ongoing {
  background: linear-gradient(135deg, color-mix(in srgb, #ce6a4b 24%, white), transparent);
}

.upcoming {
  background: linear-gradient(135deg, color-mix(in srgb, #4b7a87 24%, white), transparent);
}

.idle {
  min-width: auto;
  display: inline-flex;
  align-items: center;
}

@media (max-width: 560px) {
  .header {
    flex-direction: column;
  }

  .meta {
    width: 100%;
  }

  .pill {
    width: 100%;
  }
}
</style>
