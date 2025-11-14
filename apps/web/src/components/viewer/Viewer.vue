<template>
  <div ref="dropZoneRef" class="tres-viewer" :class="{ 'drag-over': isOverDropZone }" @dragover="handleDragOver">
    <!-- Split drag & drop overlay (only visible when dragging) -->
    <div v-if="isOverDropZone" class="drop-zone-overlay">
      <div class="drop-zone-left" :class="{ active: dropZoneHover === 'left' }">
        <div class="drop-zone-content">
          <font-awesome-icon icon="file-image" class="drop-icon" />
          <div class="drop-text">Drop Depth Map</div>
          <div class="drop-hint">Upload a grayscale depth map directly</div>
        </div>
      </div>
      <div class="drop-zone-right" :class="{ active: dropZoneHover === 'right' }">
        <div class="drop-zone-content">
          <font-awesome-icon icon="wand-magic-sparkles" class="drop-icon" />
          <div class="drop-text">Drop Image</div>
          <div class="drop-hint">Generate depth map from image</div>
        </div>
      </div>
    </div>

    <!-- Show viewer when depth map exists -->
    <div v-if="imageStore.depthMap" class="viewer-container">
      <!-- Unified 3D canvas handles both 2D plane and 3D mesh -->
      <Viewer3D @mesh-generated="handleMeshGenerated" />

      <!-- View mode toggle overlay -->
      <ViewerOverlay />
    </div>

    <!-- Show placeholder when no depth map -->
    <div v-else class="viewer-placeholder-wrapper">
      <ViewerPlaceholder />
    </div>

    <!-- Global status indicator (shows for both placeholder and viewer) -->
    <Transition name="fade">
      <div v-if="viewerStore.currentStatus" class="global-status-indicator">
        <font-awesome-icon :icon="viewerStore.currentStatus.icon" :spin="viewerStore.currentStatus.spin" />
        <span>{{ viewerStore.currentStatus.message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, provide } from "vue";
import { useDropZone } from "@vueuse/core";
import { useImageStore } from "../../stores/image";
import { useViewerStore } from "../../stores/viewer";
import Viewer3D from "./3d/Viewer3D.vue";
import ViewerOverlay from "./shared/ViewerOverlay.vue";
import ViewerPlaceholder from "./shared/ViewerPlaceholder.vue";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const dropZoneRef = ref(null);
const dropZoneHover = ref(null); // Track which zone is hovered during drag

// Provide mesh at parent level so both Viewer3D and ViewerOverlay can access it
const mesh = ref(null);
provide("mesh", mesh);

function handleMeshGenerated(generatedMesh) {
  mesh.value = generatedMesh;
}

function handleDragOver(event) {
  // Track which zone is hovered based on mouse position during drag
  const dropX = event.clientX;
  const containerWidth = dropZoneRef.value?.offsetWidth || 0;
  dropZoneHover.value = dropX < containerWidth / 2 ? "left" : "right";
}

const { isOverDropZone } = useDropZone(dropZoneRef, {
  async onDrop(files, event) {
    if (!files || files.length === 0) return;

    // Determine drop zone based on X position
    const dropX = event?.clientX || 0;
    const containerWidth = dropZoneRef.value?.offsetWidth || 0;
    const isLeftZone = dropX < containerWidth / 2;

    // Reset hover state
    dropZoneHover.value = null;

    if (isLeftZone) {
      // Left zone: Load depth map directly
      const statusId = viewerStore.showGenerating("Loading depth map...");
      try {
        await imageStore.loadDepthMapFromFile(files[0]);
      } finally {
        viewerStore.removeStatus(statusId);
      }
    } else {
      // Right zone: Generate depth map from image
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Use the same status lifecycle as the left zone/button flows:
        // capture the status id and remove it in a finally block so the
        // status queue remains consistent.
        const statusId = viewerStore.showGenerating("Generating depth map...");
        try {
          await imageStore.generateDepthMapFromImage(e.target.result);
        } catch (error) {
          console.error("Error generating depth map:", error);
        } finally {
          viewerStore.removeStatus(statusId);
        }
      };
      reader.readAsDataURL(files[0]);
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
  outline: 3px solid var(--color-primary);
  outline-offset: -3px;
  background: var(--color-primary-light);
}

/* Split drop zone overlay */
.drop-zone-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 1001;
  pointer-events: auto;
  gap: 8px;
  padding: 8px;
}

.drop-zone-left,
.drop-zone-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border: 3px dashed var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  margin: 4px;
}

.drop-zone-left {
  border-color: var(--color-primary);
}

.drop-zone-right {
  border-color: #a855f7;
}

.drop-zone-left:hover,
.drop-zone-left.active {
  background: rgba(66, 185, 131, 0.3);
  border-color: var(--color-primary);
  border-width: 4px;
  box-shadow: 0 8px 20px rgba(66, 185, 131, 0.4);
  margin: 0;
}

.drop-zone-right:hover,
.drop-zone-right.active {
  background: rgba(168, 85, 247, 0.3);
  border-color: #a855f7;
  border-width: 4px;
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
  margin: 0;
}

.drop-zone-left:hover {
  background: rgba(66, 185, 131, 0.3);
  border-width: 4px;
  box-shadow: 0 8px 20px rgba(66, 185, 131, 0.4);
  transform: scale(1.02);
}

.drop-zone-right:hover {
  background: rgba(168, 85, 247, 0.3);
  border-width: 4px;
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.4);
  transform: scale(1.02);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
  text-align: center;
  padding: 24px;
  transition: color 0.3s ease;
}

.drop-zone-left:hover .drop-zone-content,
.drop-zone-left.active .drop-zone-content {
  color: var(--color-primary-dark);
}

.drop-zone-right:hover .drop-zone-content,
.drop-zone-right.active .drop-zone-content {
  color: #7c3aed;
}

.drop-icon {
  font-size: 48px;
  color: var(--color-text-muted);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drop-zone-left:hover .drop-icon,
.drop-zone-left.active .drop-icon {
  color: var(--color-primary-dark);
  transform: translateY(-4px) scale(1.15);
  filter: drop-shadow(0 4px 8px rgba(66, 185, 131, 0.4));
}

.drop-zone-right:hover .drop-icon,
.drop-zone-right.active .drop-icon {
  color: #7c3aed;
  transform: translateY(-4px) scale(1.15);
  filter: drop-shadow(0 4px 8px rgba(168, 85, 247, 0.4));
}

.drop-text {
  font-size: 16px;
  font-weight: 600;
  transition: color 0.3s ease;
}

.drop-zone-left:hover .drop-text,
.drop-zone-left.active .drop-text {
  color: var(--color-primary-dark);
}

.drop-zone-right:hover .drop-text,
.drop-zone-right.active .drop-text {
  color: #7c3aed;
}

.drop-hint {
  font-size: 13px;
  color: var(--color-text-muted);
  max-width: 200px;
  line-height: 1.4;
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

.global-status-indicator {
  position: absolute;
  bottom: calc(var(--gallery-height, 0px) + 16px);
  left: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 0.875rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
