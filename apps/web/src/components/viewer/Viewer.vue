<template>
  <div ref="dropZoneRef" class="tres-viewer" :class="{ 'drag-over': isOverDropZone }">
    <!-- Show viewer when depth map exists -->
    <div v-if="imageStore.depthMap" class="viewer-container">
      <!-- Unified 3D canvas handles both 2D plane and 3D mesh -->
      <Viewer3D />

      <!-- View mode toggle overlay -->
      <ViewerOverlay />
    </div>

    <!-- Show placeholder when no depth map -->
    <div v-else class="viewer-placeholder-wrapper">
      <ViewerPlaceholder />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDropZone } from "@vueuse/core";
import { useImageStore } from "../../stores/image";
import { useViewerStore } from "../../stores/viewer";
import Viewer3D from "./3d/Viewer3D.vue";
import ViewerOverlay from "./shared/ViewerOverlay.vue";
import ViewerPlaceholder from "./shared/ViewerPlaceholder.vue";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const dropZoneRef = ref(null);

const { isOverDropZone } = useDropZone(dropZoneRef, {
  async onDrop(files) {
    if (!files || files.length === 0) return;

    // Show loading status immediately before file reading starts
    const statusId = viewerStore.showGenerating("Loading depth map...");

    try {
      await imageStore.loadDepthMapFromFile(files[0]);
    } finally {
      // Remove loading status - mesh generation watcher will show its own status
      viewerStore.removeStatus(statusId);
    }
  },
});
</script>

<style scoped>
.tres-viewer {
  width: 100%;
  height: 100%;
  position: relative;
  transition: all 0.2s ease;
  border-radius: var(--radius-md);
}

.tres-viewer.drag-over {
  outline: 4px dashed var(--color-primary);
  outline-offset: -4px;
  background: rgba(66, 185, 131, 0.08);
}

.tres-viewer.drag-over::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 4px dashed var(--color-primary);
  border-radius: var(--radius-md);
  pointer-events: none;
  z-index: 1000;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.viewer-placeholder-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
