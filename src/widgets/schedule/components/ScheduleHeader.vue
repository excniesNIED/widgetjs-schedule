<script setup lang="ts">
defineProps<{
  dateLabel: string
  statusText?: string
}>()
</script>

<template>
  <header class="header">
    <div class="headline">
      <div>
        <h1>{{ dateLabel }}</h1>
        <p v-if="statusText" class="status-text">
          {{ statusText }}
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  min-width: 0;
}

.headline { display: grid; gap: 0.1rem; min-width: 0; }

h1 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--widget-color);
  line-height: 1.15;
}

.status-text {
  margin: 0.18rem 0 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: color-mix(in srgb, var(--widget-color) 68%, transparent);
}

@media (max-width: 560px) {
  h1 {
    font-size: 0.96rem;
  }

  .status-text {
    font-size: 0.72rem;
  }
}
</style>
