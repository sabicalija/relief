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

  // Get the canvas container
  const container = rend.domElement.parentElement;
  if (!container) {
    console.warn("❌ Canvas container not found for gizmo");
    return false;
  }

  // Create new gizmo
  viewportGizmo.value = new ViewportGizmo(cam, rend, {
    container: container,
    size: 128,
    placement: "top-right",
    offset: { top: 80, right: 16 }, // Position below the view mode toggle
  });

  // Attach to controls if available
  if (context.controls.value) {
    viewportGizmo.value.attachControls(context.controls.value);
  }

  console.log("✅ ViewportGizmo initialized");
  return true;
};

// Render gizmo after main scene on each frame
const { onRender } = useLoop();
onRender(() => {
  if (viewportGizmo.value) {
    viewportGizmo.value.update(); // Sync gizmo with camera orientation
    viewportGizmo.value.render(); // Render the gizmo
  }
});

// Watch for camera to be ready (camera.activeCamera is a ComputedRef)
watch(
  context.camera.activeCamera,
  (newCamera) => {
    if (newCamera && context.renderer?.instance && !viewportGizmo.value) {
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

// Handle resize
watch(
  () => context.sizes.value,
  () => {
    if (viewportGizmo.value) {
      viewportGizmo.value.update();
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  if (viewportGizmo.value) {
    viewportGizmo.value.dispose();
    viewportGizmo.value = null;
  }
});
</script>
