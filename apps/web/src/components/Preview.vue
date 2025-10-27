<template>
  <div class="preview">
    <h2>Depth Map</h2>
    <div
      class="image-container"
      :class="{ 'drag-over': isDragging }"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <img
        v-if="imageStore.depthMap"
        ref="imageRef"
        :src="imageStore.depthMap"
        alt="Depth map preview"
        @load="onImageLoad"
      />
      <div v-else class="placeholder">
        <div class="placeholder-icon">🖼️</div>
        <p>No depth map loaded</p>
        <p class="placeholder-hint">Upload a depth map or select a demo below</p>
        <p class="placeholder-hint">You can also drag & drop an image here</p>
      </div>
      <div v-if="imageDimensions" class="dimensions-badge">
        {{ imageDimensions.width }} × {{ imageDimensions.height }} px
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useImageStore } from "../stores/image";

const imageStore = useImageStore();
const imageRef = ref(null);
const imageDimensions = ref(null);
const isDragging = ref(false);

function onImageLoad() {
  if (imageRef.value) {
    const dimensions = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight,
    };
    imageDimensions.value = dimensions;
    // Store dimensions in the store for use in other components
    imageStore.setImageDimensions(dimensions);
  }
}

const processFile = (file) => {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setDepthMap(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }
};

const handleDragEnter = (e) => {
  isDragging.value = true;
};

const handleDragOver = (e) => {
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  // Only set to false if we're leaving the container entirely
  if (e.target.classList.contains("image-container")) {
    isDragging.value = false;
  }
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  processFile(file);
};
</script>

<style scoped>
.preview {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
  text-align: left;
}

.image-container {
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
}

.image-container.drag-over {
  transform: scale(1.02);
  filter: brightness(1.05);
}

.image-container.drag-over::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 3px solid #42b983;
  border-radius: 8px;
  pointer-events: none;
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

.preview img {
  width: 100%;
  height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

.dimensions-badge {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgba(44, 62, 80, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  opacity: 1;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.placeholder {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.placeholder p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 1.125rem;
}

.placeholder-hint {
  font-size: 0.875rem !important;
  color: #adb5bd !important;
}

.image-container:hover .dimensions-badge {
  opacity: 0.2;
}
</style>
