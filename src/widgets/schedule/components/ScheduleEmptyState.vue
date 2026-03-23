<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description: string
  compact?: boolean
}>(), {
  title: '',
  compact: false,
})
</script>

<template>
  <div class="empty-state" :class="{ compact }">
    <strong v-if="title">{{ title }}</strong>
    <span>{{ description }}</span>
  </div>
</template>

<style scoped>
.empty-state {
  display: grid;
  gap: 0.4rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  place-items: center;
  min-height: 100%;
  padding: 1.1rem;
  text-align: center;
  color: color-mix(in srgb, var(--widget-color) 78%, transparent);
  border: 1px dashed color-mix(in srgb, var(--widget-color) 18%, transparent);
  border-radius: calc(var(--widget-border-radius, 20px) * 0.7);
  background: color-mix(in srgb, var(--widget-background-color) 78%, rgba(0,0,0,0.12));
  overflow: hidden;
}

.empty-state.compact {
  min-height: 100%;
  padding: 0.9rem;
  gap: 0.28rem;
}

.empty-state strong {
  font-size: 0.95rem;
  font-weight: 700;
}

.empty-state.compact strong {
  font-size: 0.9rem;
}

.empty-state span {
  font-size: 0.82rem;
  line-height: 1.5;
}

.empty-state.compact span {
  font-size: 0.78rem;
}
</style>
