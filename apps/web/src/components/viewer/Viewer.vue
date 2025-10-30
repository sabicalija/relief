<template>
  <div class="tres-viewer">
    <h2>{{ viewMode === "2d" ? "Depth Map" : "3D Preview" }}</h2>

    <!-- Show viewer when depth map exists -->
    <div v-if="imageStore.depthMap" ref="dropZoneRef" class="viewer-container" :class="{ 'drag-over': isOverDropZone }">
      <Viewer2D v-show="viewMode === '2d'" />
      <Viewer3D v-show="viewMode === '3d'" @update:is-generating="isGenerating = $event" />

      <!-- View mode toggle overlay -->
      <ViewerOverlay v-model:view-mode="viewMode" />
    </div>

    <!-- Show placeholder when no depth map -->
    <div v-else ref="dropZoneRef" class="viewer-placeholder-wrapper" :class="{ 'drag-over': isOverDropZone }">
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
const viewMode = ref("2d");
const dropZoneRef = ref(null);
const isGenerating = ref(false);

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      console.warn("Please drop an image file");
      return;
    }

    // Read and load the image
    const reader = new FileReader();
    reader.onload = (event) => {
      imageStore.depthMap = event.target?.result;
      // Clear custom texture so the depth map is used as texture
      imageStore.textureMap = null;
      imageStore.useCustomTexture = false;
      viewMode.value = "3d"; // Switch to 3D view after loading
    };
    reader.readAsDataURL(file);
  },
});
</script>

<style scoped>
.tres-viewer {
  width: 100%;
  position: relative;
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.viewer-container {
  width: 100%;
  height: 500px;
  position: relative;
  transition: all 0.2s;
}

.viewer-container.drag-over {
  outline: 3px dashed #42b983;
  outline-offset: 4px;
  background: rgba(66, 185, 131, 0.05);
}

.viewer-placeholder-wrapper {
  width: 100%;
  height: 500px;
  position: relative;
  transition: all 0.2s;
}

.viewer-placeholder-wrapper.drag-over {
  outline: 3px dashed #42b983;
  outline-offset: 4px;
  background: rgba(66, 185, 131, 0.05);
}
</style>
