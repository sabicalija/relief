<template>
  <div class="viewer-placeholder">
    <div class="placeholder-icon">
      <font-awesome-icon icon="image" />
    </div>
    <p>No preview available.</p>
    <p class="placeholder-hint">Load a depth map or generate one from an image.</p>
    <p class="placeholder-hint">You can also drag & drop an image here.</p>

    <div class="upload-buttons">
      <label for="placeholder-upload-depth" class="upload-button">
        <font-awesome-icon icon="upload" />
        Upload Depth Map
      </label>
      <input
        id="placeholder-upload-depth"
        type="file"
        accept="image/*"
        @change="handleDepthMapUpload"
        class="file-input"
      />

      <!-- Split button with model dropdown -->
      <div class="generate-container">
        <label for="placeholder-upload-image" class="upload-button generate-button" :class="generateButtonClass">
          <font-awesome-icon icon="wand-magic-sparkles" />
          <span>Generate from Image</span>
          <div
            v-if="!isModelReady && downloadProgress > 0"
            class="progress-bar"
            :class="{ 'progress-bar-complete': downloadProgress === 100 }"
            :style="progressBarStyle"
          ></div>
        </label>
        <button
          class="generate-dropdown-btn"
          :class="generateButtonClass"
          @click="toggleModelMenu"
          :disabled="!isModelReady"
          title="Choose model"
        >
          <font-awesome-icon icon="angle-down" />
        </button>
        <input
          id="placeholder-upload-image"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          :disabled="!isModelReady"
          class="file-input"
        />

        <!-- Model Selection Menu -->
        <div v-if="showModelMenu" class="model-menu">
          <div class="model-menu-section">
            <div class="model-menu-label">Model Quality</div>
            <button
              v-for="variant in availableVariants"
              :key="variant.value"
              @click="selectVariant(variant.value)"
              class="model-option"
              :class="{ active: imageStore.depthModelVariant === variant.value }"
            >
              <span class="model-name">{{ variant.label }}</span>
              <span class="model-desc">{{ variant.description }}</span>
            </button>
          </div>
          <div class="model-menu-section">
            <div class="model-menu-label">Execution Backend</div>
            <button
              v-for="backend in availableBackends"
              :key="backend.value"
              @click="selectBackend(backend.value)"
              class="model-option"
              :class="{ active: imageStore.depthExecutionBackend === backend.value }"
            >
              <span class="model-name">{{ backend.label }}</span>
              <span class="model-desc">{{ backend.description }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useImageStore } from "@/stores/image";
import { useViewerStore } from "@/stores/viewer";
import {
  getDefaultConfig,
  preloadModel,
  MODEL_VARIANTS,
  EXECUTION_BACKENDS,
  getSupportedBackends,
} from "@/utils/depth";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const isModelReady = ref(false);
const downloadProgress = ref(0); // 0-100
const showModelMenu = ref(false);

// Available variants and backends from depth utility config
const availableVariants = computed(() =>
  Object.entries(MODEL_VARIANTS).map(([key, config]) => ({
    value: key,
    label: config.name,
    description: config.description || `${config.size}`,
  }))
);

// Only show backends that are supported by the browser
const availableBackends = computed(() =>
  getSupportedBackends().map(({ key, config }) => ({
    value: key,
    label: config.name,
    description: config.description,
  }))
);

function toggleModelMenu() {
  showModelMenu.value = !showModelMenu.value;
}

async function selectVariant(variant) {
  if (variant !== imageStore.depthModelVariant) {
    imageStore.setDepthModelVariant(variant);
  }
  showModelMenu.value = false;
}

async function selectBackend(backend) {
  if (backend !== imageStore.depthExecutionBackend) {
    imageStore.setDepthExecutionBackend(backend);
  }
  showModelMenu.value = false;
}

// Compute button state class based on readiness
const generateButtonClass = computed(() => {
  return isModelReady.value ? "generate-button-ready" : "generate-button-disabled";
});

// Compute progress bar style (thin bar at bottom of button)
const progressBarStyle = computed(() => {
  const progress = downloadProgress.value;
  return {
    width: `${progress}%`,
  };
});

// Initialize with default settings and preload model
onMounted(async () => {
  const defaults = getDefaultConfig();
  const variant = imageStore.depthModelVariant || defaults.variant;
  const backend = imageStore.depthExecutionBackend || defaults.backend;
  imageStore.setDepthModelVariant(variant);
  imageStore.setDepthExecutionBackend(backend);

  // Preload model in background with progress tracking
  try {
    await preloadModel((progress) => {
      if (progress.status === "progress" && progress.loaded && progress.total) {
        downloadProgress.value = Math.round((progress.loaded / progress.total) * 100);
      } else if (progress.status === "done") {
        downloadProgress.value = 100;
      }
    });
    isModelReady.value = true;
    downloadProgress.value = 100;
  } catch (error) {
    console.error("[ViewerPlaceholder] Failed to preload model:", error);
    // Still allow user to try - will download on first use
    isModelReady.value = true;
  }
});

// Watch for model changes from the ModelSelector component
watch(
  () => imageStore.depthModelVariant,
  async (newVariant, oldVariant) => {
    if (newVariant && newVariant !== oldVariant) {
      // Reset model ready state and reload model
      isModelReady.value = false;
      downloadProgress.value = 0;

      // Small delay to let UI update before loading
      await new Promise((resolve) => setTimeout(resolve, 50));

      try {
        let hasProgress = false;
        await preloadModel(
          (progress) => {
            hasProgress = true;
            if (progress.status === "progress" && progress.loaded && progress.total) {
              downloadProgress.value = Math.round((progress.loaded / progress.total) * 100);
            } else if (progress.status === "done") {
              downloadProgress.value = 100;
            }
          },
          newVariant,
          imageStore.depthExecutionBackend
        );

        // If no progress events (cached), set to 100% immediately
        if (!hasProgress) {
          downloadProgress.value = 100;
        }

        isModelReady.value = true;
        downloadProgress.value = 100;
      } catch (error) {
        console.error("[ViewerPlaceholder] Failed to load new model:", error);
        isModelReady.value = true; // Allow retry
      }
    }
  }
);

const handleDepthMapUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    // Show loading status immediately before file reading starts
    const statusId = viewerStore.showGenerating("Loading depth map...");

    try {
      await imageStore.loadDepthMapFromFile(file);
    } finally {
      // Remove loading status - mesh generation watcher will show its own status
      viewerStore.removeStatus(statusId);
    }
  }
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    let statusId = null;
    try {
      // Read file as data URL
      const dataURL = await readFileAsDataURL(file);

      // Show status (will remain visible since depth generation runs in worker)
      statusId = viewerStore.showGenerating("Generating depth map...");
      console.log("[ViewerPlaceholder] Starting depth generation in worker");

      // Generate depth map (runs in Web Worker, doesn't block UI)
      await imageStore.generateDepthMapFromImage(dataURL, file.name);

      console.log("[ViewerPlaceholder] Depth generation complete");

      // Remove depth generation status
      // (mesh generation watcher will show its own status)
      if (statusId !== null) {
        viewerStore.removeStatus(statusId);
        statusId = null;
      }
    } catch (error) {
      console.error("Failed to generate depth map:", error);

      // Remove status on error
      if (statusId !== null) {
        viewerStore.removeStatus(statusId);
      }

      const errorMsg = error.message || "Unknown error occurred";
      alert(
        `Failed to generate depth map:\n\n${errorMsg}\n\nPlease check the browser console for details, or try uploading a depth map directly.`
      );
    } finally {
      // Reset file input
      event.target.value = "";
    }
  }
};

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons" as *;

.viewer-placeholder {
  position: relative;
  width: 100%;
  height: 100vh;
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

.viewer-placeholder p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 1.125rem;
}

.placeholder-hint {
  font-size: 0.875rem !important;
  color: #adb5bd !important;
  margin-block: 0;
}

.upload-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.upload-button {
  @include btn-panel-action-large;
}

.generate-container {
  position: relative;
  display: flex;
}

.generate-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  border-radius: 6px 0 0 6px;

  &:hover {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
  }

  &.generate-button-disabled {
    background: #dee2e6;
    cursor: not-allowed;
    opacity: 0.8;
    color: #6c757d;

    &:hover {
      background: #dee2e6;
    }
  }

  &.generate-button-ready {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
    }
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;

    &.progress-bar-complete {
      // Shimmer effect when download is complete but model is initializing
      background: linear-gradient(90deg, #667eea 0%, #764ba2 25%, #a78bfa 50%, #764ba2 75%, #667eea 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
  }
}

.generate-dropdown-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0 6px 6px 0;
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
  }

  &.generate-button-disabled {
    background: #dee2e6;
    cursor: not-allowed;
    opacity: 0.8;
    color: #6c757d;

    &:hover {
      background: #dee2e6;
    }
  }

  &.generate-button-ready {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
    }
  }

  svg {
    font-size: 0.875rem;
  }
}

// Keep generate button and dropdown in sync on hover
.generate-container:hover:not(:has(:disabled)) {
  .generate-button,
  .generate-dropdown-btn {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
  }
}

.model-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  min-width: 280px;
  z-index: 1000;
}

.model-menu-section {
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #e9ecef;
  }
}

.model-menu-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  margin-bottom: 0.25rem;
}

.model-option {
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

  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  &.active {
    background: rgba(102, 126, 234, 0.15);

    .model-name {
      color: #667eea;
      font-weight: 600;
    }
  }

  .model-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .model-desc {
    font-size: 0.75rem;
    color: #6c757d;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.file-input {
  display: none;

  &:disabled + .upload-button {
    pointer-events: none;
  }
}
</style>
