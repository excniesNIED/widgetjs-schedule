<script setup lang="ts">
defineProps<{
  dateLabel: string
  statusText?: string
}>()
</script>

<template>
  <header class="header">
    <h1>{{ dateLabel }}</h1>
    <p v-if="statusText" class="status-text">
      {{ statusText }}
    </p>
  </header>
</template>

<style scoped>
.header {
  min-width: 0;
  margin-bottom: 16px;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--widget-color);
  line-height: 1.2;
}

.status-text {
  margin: 4px 0 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: color-mix(in srgb, var(--widget-color) 70%, transparent);
}
</style>
