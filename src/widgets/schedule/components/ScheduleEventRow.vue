<script setup lang="ts">
import { computed } from 'vue'
import { dayjs } from '../model/date'
import {
  formatOccurrenceTime,
  formatRelativeCountdown,
} from '../model/format'
import { getReadableTextColor } from '../model/color'
import type {
  ScheduleListBackgroundMode,
  ScheduleOccurrence,
} from '../model/types'

const props = defineProps<{
  occurrence: ScheduleOccurrence
  now: string
  backgroundMode: ScheduleListBackgroundMode
}>()

const progress = computed(() => {
  if (props.backgroundMode === 'none') {
    return 0
  }

  const current = dayjs(props.now)
  const start = dayjs(props.occurrence.startAt)

  if (props.backgroundMode === 'countdown' && props.occurrence.isUpcoming) {
    const dayStart = start.startOf('day')
    const total = Math.max(start.diff(dayStart, 'millisecond'), 1)
    const elapsed = Math.max(current.diff(dayStart, 'millisecond'), 0)
    return Math.min(Math.max(elapsed / total, 0), 1)
  }

  if (
    props.backgroundMode === 'progress'
    && props.occurrence.endAt
    && props.occurrence.isOngoing
  ) {
    const end = dayjs(props.occurrence.endAt)
    const total = Math.max(end.diff(start, 'millisecond'), 1)
    const elapsed = Math.max(current.diff(start, 'millisecond'), 0)
    return Math.min(Math.max(elapsed / total, 0), 1)
  }

  return 0
})

const statusText = computed(() => {
  if (props.occurrence.isOngoing) {
    return '进行中'
  }

  if (props.occurrence.isUpcoming) {
    return formatRelativeCountdown(props.occurrence.startAt, props.now)
  }

  return '已结束'
})

const metaText = computed(() =>
  props.occurrence.description || props.occurrence.location || '',
)
const textColor = computed(() => getReadableTextColor(props.occurrence.colorToken))
</script>

<template>
  <article
    class="event-row"
    :class="{
      ongoing: occurrence.isOngoing,
      upcoming: occurrence.isUpcoming,
      past: occurrence.isPast,
    }"
    :style="{
      background: `linear-gradient(135deg, ${occurrence.colorToken}, rgba(255,255,255,0.88))`,
      '--event-text-color': textColor,
    }"
  >
    <div
      class="fill"
      :style="{
        width: `${progress * 100}%`,
        background: occurrence.progressColorToken,
      }"
    />
    <div class="content">
      <div class="time-line">
        <strong>{{ formatOccurrenceTime(occurrence) }}</strong>
        <span>{{ statusText }}</span>
      </div>
      <div class="title-line">
        <strong>{{ occurrence.title }}</strong>
        <span>{{ occurrence.repeatLabel }}</span>
      </div>
      <p v-if="metaText">
        {{ metaText }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.event-row {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--widget-color) 12%, transparent);
}

.fill {
  position: absolute;
  inset: 0 auto 0 0;
  opacity: 0.22;
  transition: width 0.3s ease;
}

.content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.32rem;
  padding: 0.68rem 0.74rem;
}

.time-line,
.title-line {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
}

.time-line strong,
.title-line strong {
  color: var(--event-text-color);
}

.time-line span,
.title-line span,
p {
  margin: 0;
  font-size: 0.72rem;
  color: color-mix(in srgb, var(--event-text-color) 72%, transparent);
}

.title-line span {
  text-align: right;
}

.title-line strong {
  font-size: 0.84rem;
  line-height: 1.35;
}

p {
  line-height: 1.45;
}

.ongoing {
  border-color: color-mix(in srgb, var(--widget-color) 24%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--widget-color) 8%, transparent);
}

.past {
  opacity: 0.72;
}
</style>
