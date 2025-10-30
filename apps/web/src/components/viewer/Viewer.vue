<template>
  <div ref="dropZoneRef" class="tres-viewer" :class="{ 'drag-over': isOverDropZone }">
    <!-- Show viewer when depth map exists -->
    <div v-if="imageStore.depthMap" class="viewer-container">
      <Viewer2D v-show="imageStore.viewMode === '2d'" />
      <Viewer3D v-show="imageStore.viewMode === '3d'" />

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
import Viewer2D from "./Viewer2D.vue";
import Viewer3D from "./Viewer3D.vue";
import ViewerOverlay from "./ViewerOverlay.vue";
import ViewerPlaceholder from "./ViewerPlaceholder.vue";

const imageStore = useImageStore();
const dropZoneRef = ref(null);

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (!files || files.length === 0) return;
    imageStore.loadDepthMapFromFile(files[0]);
  },
});
</script>

<style scoped>
.tres-viewer {
  width: 100%;
  position: relative;
  transition: all 0.2s;
}

.tres-viewer.drag-over {
  outline: 3px dashed #42b983;
  outline-offset: 4px;
  background: rgba(66, 185, 131, 0.05);
}

.viewer-container {
  width: 100%;
  height: 500px;
  position: relative;
}

.viewer-placeholder-wrapper {
  width: 100%;
  height: 500px;
  position: relative;
}
</style>
