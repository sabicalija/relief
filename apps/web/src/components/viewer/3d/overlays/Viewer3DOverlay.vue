<template>
  <div class="viewer-3d-overlay">
    <!-- Blender-style layout (top-right corner):
         1. Gizmo at top
         2. Projection mode selector below gizmo
         3. Transform mode selector at bottom -->

    <!-- Viewport gizmo (managed via store context) -->
    <GizmoManager v-if="showTransformControls" />

    <!-- Projection mode selector (directly below gizmo) -->
    <div v-if="showTransformControls" class="overlay-projection-mode">
      <ProjectionModeSelector v-model="projectionMode" />
    </div>

    <!-- Transform mode selector (below projection mode) -->
    <div v-if="showTransformControls" class="overlay-transform-mode">
      <TransformModeSelector v-model="transformMode" />
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

// Blender-style positioning:
// Gizmo: top-right (16px from top, 16px from right)
// Projection: below gizmo with spacing
// Transform: below projection with spacing

.overlay-projection-mode {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 160px); // Header + Gizmo offset (16px) + Gizmo size (128px) + gap (16px)
  right: var(--spacing-md);
  z-index: 100;
  transition: top 0.3s ease-in-out;
}

.overlay-transform-mode {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 225px); // Projection position + projection height (48px) + gap (16px)
  right: var(--spacing-md);
  z-index: 100;
  transition: top 0.3s ease-in-out;
}
</style>
