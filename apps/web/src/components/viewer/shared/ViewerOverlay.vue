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
      <button
        class="download-btn"
        @click="handleDownload(imageStore.viewMode === '2d' ? 'png' : 'stl')"
        :disabled="!isDownloadAvailable"
        :title="imageStore.viewMode === '2d' ? 'Download depth map' : 'Download STL'"
        tabindex="3"
      >
        <font-awesome-icon icon="download" />
        <span>Download</span>
      </button>
      <button
        class="download-dropdown-btn"
        @click="toggleFormatMenu"
        :disabled="!isDownloadAvailable"
        title="Choose format"
        tabindex="3"
      >
        <font-awesome-icon icon="angle-down" />
      </button>

      <!-- Format Selection Menu (2D view - image formats) -->
      <div v-if="showFormatMenu && imageStore.viewMode === '2d'" class="format-menu">
        <button @click="handleDownload('png')" class="format-option">
          <span class="format-name">PNG</span>
          <span class="format-desc">Lossless, transparency</span>
        </button>
        <button @click="handleDownload('jpg')" class="format-option">
          <span class="format-name">JPG</span>
          <span class="format-desc">Compressed, smaller size</span>
        </button>
        <button @click="handleDownload('webp')" class="format-option">
          <span class="format-name">WebP</span>
          <span class="format-desc">Modern, efficient</span>
        </button>
      </div>

      <!-- Format Selection Menu (3D view - 3D formats) -->
      <div v-if="showFormatMenu && imageStore.viewMode === '3d'" class="format-menu">
        <button @click="handleDownload('stl')" class="format-option">
          <span class="format-name">STL</span>
          <span class="format-desc">Binary, 3D printing</span>
        </button>
        <button @click="handleDownload('obj')" class="format-option">
          <span class="format-name">OBJ</span>
          <span class="format-desc">Text, universal compatibility</span>
        </button>
        <button @click="handleDownload('ply')" class="format-option">
          <span class="format-name">PLY</span>
          <span class="format-desc">Binary, point clouds</span>
        </button>
        <button @click="handleDownload('glb')" class="format-option">
          <span class="format-name">GLB</span>
          <span class="format-desc">Web 3D standard, with textures</span>
        </button>
        <button @click="handleDownload('usdz')" class="format-option">
          <span class="format-name">USDZ</span>
          <span class="format-desc">Apple AR, with textures</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, inject } from "vue";
import { useImageStore } from "../../../stores/image";
import { useViewerStore } from "../../../stores/viewer";
import { exportToSTL, download as downloadSTL } from "../../../utils/mesh/stl";
import { exportToOBJ, download as downloadOBJ } from "../../../utils/mesh/obj";
import { exportToPLY, download as downloadPLY } from "../../../utils/mesh/ply";
import { exportToGLTF, download as downloadGLTF } from "../../../utils/mesh/gltf";
import { exportToUSDZ, download as downloadUSDZ } from "../../../utils/mesh/usdz";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

// Get mesh from parent component (Viewer3D provides it)
const mesh = inject("mesh", ref(null));

// Check if download is available based on view mode
const isDownloadAvailable = computed(() => {
  if (imageStore.viewMode === "2d") {
    const available = !!imageStore.depthMap;
    console.log("[Download] 2D mode - depth map available:", available);
    return available;
  } else {
    const available = !!mesh.value;
    console.log("[Download] 3D mode - mesh available:", available, mesh.value);
    return available;
  }
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
  // Close format menu
  showFormatMenu.value = false;

  // Handle image downloads (2D view)
  if (["png", "jpg", "webp"].includes(format)) {
    if (!imageStore.depthMap) return;

    const statusId = viewerStore.addStatus(`Exporting ${format.toUpperCase()}...`, "spinner", {
      spin: true,
      priority: 10,
    });

    try {
      // Generate filename
      const baseFilename = imageStore.depthMapFilename
        ? imageStore.depthMapFilename.replace(/\.[^/.]+$/, "")
        : "relief-depthmap";
      const filename = `${baseFilename}.${format}`;

      // Create canvas and draw image
      const img = new Image();
      img.src = imageStore.depthMap;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Convert to blob and download
      const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
      const quality = format === "jpg" ? 0.95 : undefined;

      canvas.toBlob(
        (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);

          viewerStore.removeStatus(statusId);
          viewerStore.showSuccess(`Downloaded ${filename}`, 2000);
        },
        mimeType,
        quality
      );
    } catch (error) {
      console.error("Error exporting image:", error);
      viewerStore.removeStatus(statusId);
      viewerStore.showError(`Export failed: ${error.message}`, 5000);
    }
    return;
  }

  // Handle 3D mesh downloads
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
        // Pass base filename as object name (without extension)
        blob = exportToPLY(mesh.value, baseFilename);
        downloadPLY(blob, filename);
        break;
      case "glb":
        blob = await exportToGLTF(mesh.value, baseFilename, true);
        downloadGLTF(blob, filename);
        break;
      case "usdz":
        blob = await exportToUSDZ(mesh.value, baseFilename);
        downloadUSDZ(blob, filename);
        break;
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
