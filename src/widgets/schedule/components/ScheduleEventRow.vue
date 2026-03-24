<script setup lang="ts">
import { computed } from 'vue'
import { formatOccurrenceTime } from '../model/format'
import { getOccurrenceFillRatio, getOccurrenceStatusText } from '../model/list'
import type {
  ScheduleListBackgroundMode,
  ScheduleOccurrence,
} from '../model/types'

const props = defineProps<{
  occurrence: ScheduleOccurrence
  now: string
  backgroundMode: ScheduleListBackgroundMode
}>()

const fillRatio = computed(() => getOccurrenceFillRatio(
  props.occurrence,
  props.now,
  props.backgroundMode,
))

const statusText = computed(() => getOccurrenceStatusText(
  props.occurrence,
  props.now,
  props.backgroundMode,
))

const fillStyle = computed(() => {
  const baseColor = props.occurrence.progressColorToken || 'var(--bg-progress)'
  return {
    '--progress-width': `${fillRatio.value * 100}%`,
    '--progress-background': baseColor,
  }
})
</script>

<template>
  <article
    class="schedule-card"
    :class="{
      ongoing: occurrence.isOngoing,
      upcoming: occurrence.isUpcoming,
      past: occurrence.isPast,
      'countdown-mode': backgroundMode === 'countdown',
    }"
    :style="fillStyle"
  >
    <div class="card-main">
      <strong class="card-title">{{ occurrence.title }}</strong>
      <span v-if="occurrence.description" class="card-desc">{{ occurrence.description }}</span>
      <span class="card-time">{{ formatOccurrenceTime(occurrence) }}</span>
    </div>
    <span class="card-status">{{ statusText }}</span>
  </article>
</template>

<style scoped>
.schedule-card {
  position: relative;
  z-index: 1;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: var(--schedule-card-radius, 12px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  gap: 12px;
  padding: var(--schedule-card-padding-y, 8px) var(--schedule-card-padding-x, 14px);
  min-height: var(--schedule-card-height, 48px);
  box-sizing: border-box;
  background: var(--bg-card, color-mix(in srgb, var(--widget-background-color) 30%, transparent));
}

.schedule-card::before {
  content: '';
  position: absolute;
  inset: 0;
  width: min(100%, var(--progress-width, 0%));
  background: var(--progress-background, var(--bg-progress, color-mix(in srgb, var(--widget-color) 14%, transparent)));
  border-radius: inherit;
  z-index: 0;
  transition: width 0.3s ease;
}

.countdown-mode::before {
  left: auto;
  right: 0;
}

.card-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--schedule-card-stack-gap, 2px);
  min-width: 0;
}

.card-title {
  color: var(--text-primary, var(--widget-color));
  font-size: var(--schedule-card-title-size, 0.75rem);
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: var(--schedule-meta-size, 0.5625rem);
  color: var(--text-secondary, color-mix(in srgb, var(--widget-color) 80%, transparent));
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-time {
  font-size: var(--schedule-meta-size, 0.5625rem);
  color: var(--text-secondary, color-mix(in srgb, var(--widget-color) 80%, transparent));
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-status {
  position: relative;
  z-index: 1;
  width: 48px;
  font-size: var(--schedule-meta-size, 0.5625rem);
  color: var(--text-secondary, color-mix(in srgb, var(--widget-color) 80%, transparent));
  line-height: 1.2;
  white-space: nowrap;
  text-align: right;
  justify-self: end;
}

.ongoing {
  background: var(--bg-card-active, color-mix(in srgb, var(--widget-background-color) 40%, transparent));
}

.schedule-card.countdown-mode {
  --progress-background: var(--bg-countdown, color-mix(in srgb, #ffd36e 34%, transparent));
}

.past {
  opacity: 0.6;
}
</style>
