<script setup lang="ts">
defineProps<{
  dateLabel: string
  todayCount: number
  toggleLabel: string
  toggleIcon: 'calendar' | 'list'
}>()

defineEmits<{
  'toggle-view': []
}>()
</script>

<template>
  <header class="header">
    <div class="headline">
      <div>
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
  </header>
</template>

<style scoped>
.header {
  min-width: 0;
}

.headline {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  align-items: center;
  min-width: 0;
}

h1 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--widget-color);
  line-height: 1.15;
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

@media (max-width: 560px) {
  h1 {
    font-size: 0.96rem;
  }
}
</style>
