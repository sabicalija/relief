<template>
  <div class="viewer-3d-overlay">
    <!-- Loading indicator -->
    <div v-if="isGenerating" class="loading-indicator">
      <font-awesome-icon icon="spinner" spin />
      <span>Generating...</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isGenerating: {
    type: Boolean,
    required: true,
  },
});
</script>

<style scoped lang="scss">
@use "@/styles/overlays.scss" as overlays;

.viewer-3d-overlay {
  @include overlays.overlay-base;
  @include overlays.overlay-top-right;
  pointer-events: none;
}

.loading-indicator {
  color: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  pointer-events: auto;
}
</style>
