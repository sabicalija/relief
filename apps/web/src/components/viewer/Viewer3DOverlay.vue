<template>
  <div class="viewer-3d-overlay">
    <!-- Transform mode selector (top-right, below viewport gizmo) -->
    <div v-if="showTransformControls" class="overlay-top-right">
      <TransformModeSelector v-model="transformMode" />
    </div>
  </div>
</template>

<script setup>
import TransformModeSelector from "./3d/TransformModeSelector.vue";

const props = defineProps({
  showTransformControls: {
    type: Boolean,
    default: false,
  },
});

const transformMode = defineModel("transformMode", {
  type: String,
  default: "translate",
});
</script>

<style scoped lang="scss">
@use "@/styles/layout/overlays.scss" as overlays;

.viewer-3d-overlay {
  // Pass-through container - no positioning
  pointer-events: none;
}

.overlay-top-right {
  @include overlays.overlay-top-right;
  z-index: 100; // Above canvas
}
</style>
