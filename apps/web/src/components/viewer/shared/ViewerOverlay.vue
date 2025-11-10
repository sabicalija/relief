<template>
  <div class="viewer-overlay">
    <!-- View Mode Toggle -->
    <div class="view-mode-toggle">
      <button
        @click="imageStore.viewMode = '2d'"
        :class="['toggle-btn', { active: imageStore.viewMode === '2d' }]"
        title="View depth map"
        tabindex="1"
      >
        2D
      </button>
      <button
        @click="imageStore.viewMode = '3d'"
        :class="['toggle-btn', { active: imageStore.viewMode === '3d' }]"
        title="View 3D model"
        tabindex="2"
      >
        3D
      </button>
    </div>

    <!-- Download Button -->
    <button class="download-btn" @click="handleDownload" :disabled="!mesh" title="Download STL" tabindex="3">
      <font-awesome-icon icon="download" />
      <span>Download</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useImageStore } from "../../../stores/image";
import { useViewerStore } from "../../../stores/viewer";
import { useMeshGeneration } from "../../../composables/useMeshGeneration";
import { exportToSTL, download } from "../../../utils/mesh/stl";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

// Access the same mesh instance used by Viewer3D
const { mesh } = useMeshGeneration({
  depthMap: computed(() => imageStore.depthMap),
  meshConfig: computed(() => imageStore.meshGenerationConfig),
  statusStore: viewerStore,
});

function handleDownload() {
  if (!mesh.value) return;

  try {
    // Generate filename from depth map filename or use default
    const baseFilename = imageStore.depthMapFilename ? imageStore.depthMapFilename.replace(/\.[^/.]+$/, "") : "relief";
    const filename = `${baseFilename}.stl`;

    // Export and download
    const stlBlob = exportToSTL(mesh.value);
    download(stlBlob, filename);

    // Show success message
    viewerStore.showSuccess(`Downloaded ${filename}`, 2000);
  } catch (error) {
    console.error("Error exporting STL:", error);
    viewerStore.showError(`Export failed: ${error.message}`, 5000);
  }
}
</script>

<style scoped lang="scss">
@use "@/styles/layout/overlays.scss" as overlays;

.viewer-overlay {
  @include overlays.overlay-base;
  @include overlays.overlay-top-left;
  top: calc(var(--header-height, 0px) + var(--spacing-md));
  pointer-events: none; // Make container non-interactive
  transition: top 0.3s ease-in-out;
  display: flex;
  gap: 0.5rem;
}

.viewer-overlay > * {
  pointer-events: auto; // Make children interactive
}

.view-mode-toggle {
  display: flex;
  gap: 0.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  background-color: transparent;
  color: #4b5563; /* Dark gray for inactive buttons */
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover:not(.active) {
  background-color: rgba(0, 0, 0, 0.05);
  color: #1f2937; /* Even darker on hover */
}

.toggle-btn.active {
  background-color: #3b82f6; /* Direct color instead of CSS variable */
  color: white; /* White text on blue background */
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--color-primary);
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);

  &:hover:not(:disabled) {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: var(--color-disabled);
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  svg {
    font-size: 1rem;
  }
}
</style>
