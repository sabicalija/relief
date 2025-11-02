<template>
  <!-- This component manages the viewport gizmo using store context -->
  <!-- Can be placed anywhere (doesn't need to be inside TresCanvas) -->
</template>

<script setup>
import { watch, onUnmounted, shallowRef, computed } from "vue";
import { useViewerStore } from "../../../stores/viewer";
import { ViewportGizmo } from "three-viewport-gizmo";

const viewerStore = useViewerStore();
const viewportGizmo = shallowRef(null);

// Computed refs from store
const camera = computed(() => viewerStore.camera);
const renderer = computed(() => viewerStore.renderer);
const controls = computed(() => viewerStore.controls);

// Initialize gizmo when camera and renderer are ready
const initGizmo = () => {
  const cam = camera.value;
  const rend = renderer.value;

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
    offset: { top: 16, right: 16 },
  });

  // Attach to controls if available
  if (controls.value) {
    viewportGizmo.value.attachControls(controls.value);
  }

  return true;
};

// Render callback for gizmo
const renderGizmo = () => {
  if (viewportGizmo.value) {
    viewportGizmo.value.update();
    viewportGizmo.value.render();
  }
};

// Register render callback and store unregister function
let unregisterRenderCallback = null;

// Watch for camera to be ready
watch(
  camera,
  (newCamera) => {
    if (newCamera && renderer.value) {
      // Dispose existing gizmo if any
      if (viewportGizmo.value) {
        viewportGizmo.value.dispose();
        viewportGizmo.value = null;
      }

      // Unregister previous callback
      if (unregisterRenderCallback) {
        unregisterRenderCallback();
        unregisterRenderCallback = null;
      }

      // Initialize new gizmo
      if (initGizmo()) {
        // Register render callback with store
        unregisterRenderCallback = viewerStore.registerRenderCallback(renderGizmo);
      }
    }
  },
  { immediate: true }
);

// Watch for controls to become available and attach them
watch(controls, (newControls) => {
  if (newControls && viewportGizmo.value) {
    viewportGizmo.value.attachControls(newControls);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (unregisterRenderCallback) {
    unregisterRenderCallback();
  }
  if (viewportGizmo.value) {
    viewportGizmo.value.dispose();
  }
});
</script>

<style>
/* Global style for the viewport gizmo - uses CSS variable for dynamic positioning */
.viewport-gizmo {
  margin-top: calc(var(--header-height, 0px) + 16px) !important;
  transition: margin-top 0.3s ease-in-out !important;
}
</style>
