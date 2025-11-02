<template>
  <div class="viewer-3d-overlay">
    <!-- Viewport gizmo (managed via store context) -->
    <GizmoManager v-if="showTransformControls" />

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
import GizmoManager from "../../shared/GizmoManager.vue";
import TransformModeSelector from "../controls/TransformModeSelector.vue";
import ProjectionModeSelector from "../controls/ProjectionModeSelector.vue";

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
  top: calc(var(--header-height, 0px) + var(--spacing-md));
  z-index: 100; // Above canvas
  transition: top 0.3s ease-in-out;
}

.overlay-below-gizmo {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 224px); // Header + Gizmo (80px) + height (128px) + gap (16px)
  right: var(--spacing-md);
  z-index: 100; // Above canvas
  transition: top 0.3s ease-in-out;
}
</style>
