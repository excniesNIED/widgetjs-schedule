<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="empty-state">
    <strong>{{ title }}</strong>
    <span>{{ description }}</span>
  </div>
</template>

<style scoped>
.empty-state {
  display: grid;
  gap: 0.4rem;
  place-items: center;
  min-height: 8rem;
  padding: 1rem;
  text-align: center;
  color: color-mix(in srgb, var(--widget-color) 78%, transparent);
  border: 1px dashed color-mix(in srgb, var(--widget-color) 18%, transparent);
  border-radius: calc(var(--widget-border-radius, 20px) * 0.7);
  background: color-mix(in srgb, var(--widget-background-color) 92%, white);
}

.empty-state strong {
  font-size: 0.95rem;
  font-weight: 700;
}

.empty-state span {
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
