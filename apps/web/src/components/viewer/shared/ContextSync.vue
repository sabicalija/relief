<template>
  <!-- This component syncs TresJS context to the viewer store -->
  <!-- Must be placed inside TresCanvas -->
</template>

<script setup>
import { watch, onUnmounted } from "vue";
import { useTresContext, useLoop } from "@tresjs/core";
import { useViewerStore } from "../../../stores/viewer";

const context = useTresContext();
const viewerStore = useViewerStore();

// Sync camera to store
watch(
  () => context.camera.activeCamera.value,
  (camera) => {
    viewerStore.setCamera(camera);
  },
  { immediate: true }
);

// Sync renderer to store
watch(
  () => context.renderer?.instance,
  (renderer) => {
    viewerStore.setRenderer(renderer);
  },
  { immediate: true }
);

// Sync controls to store
watch(
  () => context.controls.value,
  (controls) => {
    viewerStore.setControls(controls);
  },
  { immediate: true }
);

// Execute render callbacks on each frame
const { onRender } = useLoop();
onRender(() => {
  viewerStore.executeRenderCallbacks();
});

// Clear store on unmount
onUnmounted(() => {
  viewerStore.clearContext();
});
</script>
