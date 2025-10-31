<template>
  <div class="viewer-3d-overlay">
    <!-- Transform mode selector (top-right, above gizmo) -->
    <div v-if="showTransformControls" class="overlay-top-right">
      <TransformModeSelector v-model="transformMode" />
    </div>

    <!-- Projection mode selector (below gizmo) -->
    <div v-if="showTransformControls" class="overlay-below-gizmo">
      <ProjectionModeSelector v-model="projectionMode" />
    </div>
  </div>
</template>

<script setup>
import TransformModeSelector from "./3d/TransformModeSelector.vue";
import ProjectionModeSelector from "./3d/ProjectionModeSelector.vue";

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

const projectionMode = defineModel("projectionMode", {
  type: String,
  default: "perspective",
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

.overlay-below-gizmo {
  @include overlays.overlay-base;
  top: 224px; // Gizmo starts at 80px, has 128px height, + 16px gap = 224px
  right: var(--spacing-md);
  z-index: 100; // Above canvas
}
</style>
