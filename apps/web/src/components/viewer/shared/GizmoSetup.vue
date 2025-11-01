<template>
  <!-- This component has no visual template - it only sets up the gizmo -->
</template>

<script setup>
import { watch, onUnmounted, shallowRef } from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { ViewportGizmo } from "three-viewport-gizmo";

const context = useTresContext();
const viewportGizmo = shallowRef(null);

// Initialize gizmo when camera and renderer are ready
const initGizmo = () => {
  const cam = context.camera.activeCamera.value;
  const rend = context.renderer?.instance;

  if (!cam || !rend) {
    return false;
  }

  const container = rend.domElement.parentElement;
  if (!container) {
    return false;
  }

  // Create gizmo with className for CSS styling
  viewportGizmo.value = new ViewportGizmo(cam, rend, {
    container: container,
    size: 128,
    placement: "top-right",
    className: "viewport-gizmo",
    offset: { top: 80, right: 16 },
  });

  // Attach to controls if available
  if (context.controls.value) {
    viewportGizmo.value.attachControls(context.controls.value);
  }

  return true;
};

// Render gizmo after main scene on each frame
const { onRender } = useLoop();
onRender(() => {
  if (viewportGizmo.value) {
    viewportGizmo.value.update();
    viewportGizmo.value.render();
  }
});

// Watch for camera to be ready
watch(
  context.camera.activeCamera,
  (newCamera) => {
    if (newCamera && context.renderer?.instance) {
      if (viewportGizmo.value) {
        viewportGizmo.value.dispose();
        viewportGizmo.value = null;
      }
      initGizmo();
    }
  },
  { immediate: true }
);

// Watch for controls to become available and attach them
watch(
  () => context.controls.value,
  (newControls) => {
    if (newControls && viewportGizmo.value) {
      viewportGizmo.value.attachControls(newControls);
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  if (viewportGizmo.value) {
    viewportGizmo.value.dispose();
  }
});
</script>

<style>
/* Global style for the viewport gizmo - uses CSS variable for dynamic positioning */
.viewport-gizmo {
  margin-top: calc(var(--header-height, 0px) + 80px) !important;
  transition: margin-top 0.3s ease-in-out !important;
}
</style>
