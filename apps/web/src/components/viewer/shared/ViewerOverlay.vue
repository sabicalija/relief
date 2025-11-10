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

    <!-- Download Button with Format Dropdown -->
    <div class="download-container">
      <button class="download-btn" @click="handleDownload('stl')" :disabled="!mesh" title="Download STL" tabindex="3">
        <font-awesome-icon icon="download" />
        <span>Download</span>
      </button>
      <button
        class="download-dropdown-btn"
        @click="toggleFormatMenu"
        :disabled="!mesh"
        title="Choose format"
        tabindex="3"
      >
        <font-awesome-icon icon="angle-down" />
      </button>

      <!-- Format Selection Menu -->
      <div v-if="showFormatMenu" class="format-menu">
        <button @click="handleDownload('stl')" class="format-option">
          <span class="format-name">STL</span>
          <span class="format-desc">Binary format, 3D printing</span>
        </button>
        <button @click="handleDownload('obj')" class="format-option">
          <span class="format-name">OBJ</span>
          <span class="format-desc">Text format, universal compatibility</span>
        </button>
        <button @click="handleDownload('ply')" class="format-option" disabled>
          <span class="format-name">PLY</span>
          <span class="format-desc">Coming soon</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useImageStore } from "../../../stores/image";
import { useViewerStore } from "../../../stores/viewer";
import { useMeshGeneration } from "../../../composables/useMeshGeneration";
import { exportToSTL, download as downloadSTL } from "../../../utils/mesh/stl";
import { exportToOBJ, download as downloadOBJ } from "../../../utils/mesh/obj";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

// Access the same mesh instance used by Viewer3D
const { mesh } = useMeshGeneration({
  depthMap: computed(() => imageStore.depthMap),
  meshConfig: computed(() => imageStore.meshGenerationConfig),
  statusStore: viewerStore,
});

// Format menu state
const showFormatMenu = ref(false);

function toggleFormatMenu() {
  showFormatMenu.value = !showFormatMenu.value;
}

// Close menu when clicking outside
function handleClickOutside(event) {
  const container = event.target.closest(".download-container");
  if (!container && showFormatMenu.value) {
    showFormatMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

async function handleDownload(format = "stl") {
  if (!mesh.value) return;

  // Close format menu
  showFormatMenu.value = false;

  // Show processing status immediately
  const statusId = viewerStore.addStatus(`Exporting ${format.toUpperCase()}...`, "spinner", {
    spin: true,
    priority: 10,
  });

  // Give browser time to render the status (100ms should be visible to user)
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Generate filename from depth map filename or use default
    const baseFilename = imageStore.depthMapFilename ? imageStore.depthMapFilename.replace(/\.[^/.]+$/, "") : "relief";
    const filename = `${baseFilename}.${format}`;

    // Export based on format
    let blob;
    switch (format) {
      case "stl":
        blob = exportToSTL(mesh.value);
        downloadSTL(blob, filename);
        break;
      case "obj":
        // Pass base filename as object name (without extension)
        blob = exportToOBJ(mesh.value, baseFilename);
        downloadOBJ(blob, filename);
        break;
      case "ply":
        // TODO: Implement PLY export
        viewerStore.removeStatus(statusId);
        viewerStore.showError("PLY export not yet implemented", 3000);
        return;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Remove processing status and show success
    viewerStore.removeStatus(statusId);
    viewerStore.showSuccess(`Downloaded ${filename}`, 2000);
  } catch (error) {
    console.error("Error exporting:", error);
    viewerStore.removeStatus(statusId);
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

.download-container {
  position: relative;
  display: flex;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: var(--color-primary);
  border: none;
  border-radius: 6px 0 0 6px;
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

.download-dropdown-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary);
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0 6px 6px 0;
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
    font-size: 0.875rem;
  }
}

// Keep download button and dropdown in sync on hover
.download-container:hover:not(:has(:disabled)) {
  .download-btn,
  .download-dropdown-btn {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 185, 131, 0.4);
  }
}

.format-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  min-width: 200px;
  z-index: 1000;
}

.format-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .format-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #1f2937;
  }

  .format-desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }
}
</style>
