<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description: string
}>(), {
  title: '',
})
</script>

<template>
  <div class="empty-state">
    <strong v-if="title">{{ title }}</strong>
    <span>{{ description }}</span>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px;
  text-align: center;
  color: color-mix(in srgb, var(--widget-color) 70%, transparent);
  border: 1px dashed color-mix(in srgb, var(--widget-color) 20%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--widget-background-color) 20%, transparent);
  overflow: hidden;
}

.empty-state strong {
  font-size: 1.125rem;
  font-weight: 700;
}

.empty-state span {
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
