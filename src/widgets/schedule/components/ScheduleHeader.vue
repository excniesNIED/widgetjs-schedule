<script setup lang="ts">
import { computed } from 'vue'
import { formatOccurrenceTime } from '../model/format'
import {
  getHeaderBadge,
  type ScheduleHeaderBadge,
} from '../model/presentation'
import type { ScheduleOccurrence } from '../model/types'

const props = defineProps<{
  dateLabel: string
  current?: ScheduleOccurrence
  next?: ScheduleOccurrence
  todayCount: number
  toggleLabel: string
  toggleIcon: 'calendar' | 'list'
}>()

defineEmits<{
  'toggle-view': []
}>()

const badge = computed<ScheduleHeaderBadge | null>(() =>
  getHeaderBadge(
    {
      current: props.current,
      next: props.next,
    },
    props.todayCount,
  ),
)
</script>

<template>
  <header class="header">
    <div class="headline">
      <div>
        <p class="eyebrow">今日节奏</p>
        <h1>{{ dateLabel }}</h1>
      </div>
      <button
        type="button"
        class="view-toggle"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        @click="$emit('toggle-view')"
      >
        <svg
          v-if="toggleIcon === 'calendar'"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          />
          <path d="M8 13h3M8 17h3M14 13h3M14 17h3" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      </button>
    </div>
    <div v-if="badge" class="meta">
      <div
        class="pill ongoing"
        :class="badge.kind"
      >
        <span v-if="badge.kind === 'ongoing'">进行中</span>
        <span v-else-if="badge.kind === 'upcoming'">下一项</span>
        <span v-else>今日摘要</span>
        <strong>{{ badge.title }}</strong>
        <small v-if="badge.kind === 'ongoing' && current">
          {{ formatOccurrenceTime(current) }}
        </small>
        <small v-else-if="badge.kind === 'upcoming' && next">
          {{ formatOccurrenceTime(next) }}
        </small>
        <small v-else-if="badge.kind === 'summary'">
          {{ badge.emphasis }}
        </small>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: grid;
  gap: 0.8rem;
}

.headline {
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
  font-size: 1rem;
  font-weight: 700;
  color: var(--widget-color);
  line-height: 1.15;
}

.meta {
  display: flex;
  min-width: 0;
}

.view-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  color: var(--widget-color);
  background: color-mix(in srgb, var(--widget-background-color) 82%, white);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.view-toggle:hover {
  background: color-mix(in srgb, var(--widget-background-color) 70%, white);
}

.view-toggle:active {
  transform: scale(0.97);
}

.view-toggle svg {
  width: 1.18rem;
  height: 1.18rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pill {
  min-width: 0;
  display: grid;
  gap: 0.12rem;
  padding: 0.52rem 0.7rem;
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

.summary {
  background: color-mix(in srgb, var(--widget-background-color) 82%, white);
}

@media (max-width: 560px) {
  .headline {
    align-items: center;
  }

  .meta {
    width: 100%;
  }

  .pill {
    width: 100%;
  }
}
</style>
