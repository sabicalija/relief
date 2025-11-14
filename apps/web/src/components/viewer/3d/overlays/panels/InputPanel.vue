<template>
  <div class="input-panel">
    <!-- Input Image Section -->
    <div class="section">
      <div class="section-header">Input Image</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Filename</label>
          <span class="property-value">{{ filename || "—" }}</span>
        </div>
        <div class="property-row">
          <label class="param-label">Resolution</label>
          <span class="property-value">{{ resolution }}</span>
        </div>
        <div class="property-row">
          <label class="param-label">Aspect Ratio</label>
          <span class="property-value">{{ aspectRatio }}</span>
        </div>
        <div class="property-row">
          <label class="param-label">File Size</label>
          <span class="property-value">{{ fileSize }}</span>
        </div>
      </div>

      <!-- Upload buttons -->
      <div class="upload-buttons">
        <button class="upload-button" @click="triggerDepthInput">
          <font-awesome-icon icon="upload" />
          <span>Upload Depth Map</span>
        </button>

        <!-- Split button with model dropdown -->
        <div class="generate-container" ref="generateContainerRef">
          <button class="upload-button generate-button" @click="triggerImageInput">
            <font-awesome-icon icon="wand-magic-sparkles" />
            <span>Generate from Image</span>
          </button>
          <button class="generate-dropdown-btn" @click="toggleModelMenu" title="Choose model">
            <font-awesome-icon icon="angle-down" />
          </button>

          <!-- Model Selection Menu (using Teleport to escape overflow context) -->
          <Teleport to="body">
            <div v-if="showModelMenu" class="model-menu" :style="menuStyle" @click.stop>
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
          </Teleport>
        </div>
      </div>

      <input type="file" class="file-input-hidden" accept="image/*" @change="handleDepthUpload" ref="depthInputRef" />
      <input type="file" class="file-input-hidden" accept="image/*" @change="handleImageUpload" ref="imageInputRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick } from "vue";
import { useImageStore } from "@/stores/image";
import { useViewerStore } from "@/stores/viewer";
import { MODEL_VARIANTS, getSupportedBackends } from "@/utils/depth";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const depthInputRef = ref(null);
const imageInputRef = ref(null);
const generateContainerRef = ref(null);
const showModelMenu = ref(false);
const menuStyle = ref({});

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

function updateMenuPosition() {
  if (!generateContainerRef.value) return;

  const rect = generateContainerRef.value.getBoundingClientRect();
  menuStyle.value = {
    position: "fixed",
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
    minWidth: "280px",
  };
}

function toggleModelMenu() {
  showModelMenu.value = !showModelMenu.value;
  if (showModelMenu.value) {
    nextTick(() => {
      updateMenuPosition();
      // Add click listener to close menu when clicking outside
      document.addEventListener("click", closeMenuOnClickOutside);
    });
  } else {
    document.removeEventListener("click", closeMenuOnClickOutside);
  }
}

function closeMenuOnClickOutside(event) {
  if (!generateContainerRef.value?.contains(event.target)) {
    showModelMenu.value = false;
    document.removeEventListener("click", closeMenuOnClickOutside);
  }
}

async function selectVariant(variant) {
  if (variant !== imageStore.depthModelVariant) {
    imageStore.setDepthModelVariant(variant);
  }
  showModelMenu.value = false;
  document.removeEventListener("click", closeMenuOnClickOutside);
}

async function selectBackend(backend) {
  if (backend !== imageStore.depthExecutionBackend) {
    imageStore.setDepthExecutionBackend(backend);
  }
  showModelMenu.value = false;
  document.removeEventListener("click", closeMenuOnClickOutside);
}

onUnmounted(() => {
  document.removeEventListener("click", closeMenuOnClickOutside);
});

// Computed properties for display
const filename = computed(() => imageStore.depthMapFilename);

const resolution = computed(() => {
  if (!imageStore.imageDimensions) return "—";
  const { width, height } = imageStore.imageDimensions;
  return `${width} × ${height}`;
});

const aspectRatio = computed(() => {
  if (!imageStore.imageDimensions) return "—";
  const { width, height } = imageStore.imageDimensions;

  // Calculate GCD for simplification
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  // Common aspect ratios to recognize
  const commonRatios = [
    { w: 1, h: 1, name: "1:1" },
    { w: 4, h: 3, name: "4:3" },
    { w: 3, h: 2, name: "3:2" },
    { w: 16, h: 10, name: "16:10" },
    { w: 16, h: 9, name: "16:9" },
    { w: 21, h: 9, name: "21:9" },
    { w: 5, h: 4, name: "5:4" },
    { w: 3, h: 4, name: "3:4" }, // portrait
    { w: 2, h: 3, name: "2:3" }, // portrait
    { w: 9, h: 16, name: "9:16" }, // portrait
  ];

  // Check if it matches a common ratio
  for (const ratio of commonRatios) {
    if (w === ratio.w && h === ratio.h) {
      return ratio.name;
    }
  }

  // For non-standard ratios, show normalized form (1:x.xx)
  const normalized = (width / height).toFixed(2);
  return `1:${normalized}`;
});

const fileSize = computed(() => {
  if (!imageStore.depthMapFileSize) return "—";
  const bytes = imageStore.depthMapFileSize;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
});

// Upload functionality
function triggerDepthInput() {
  if (depthInputRef.value) {
    depthInputRef.value.click();
  }
}

function triggerImageInput() {
  if (imageInputRef.value) {
    imageInputRef.value.click();
  }
}

async function handleDepthUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusId = viewerStore.showGenerating("Loading depth map...");

  try {
    await imageStore.loadDepthMapFromFile(file);
    // Set the same file as texture
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setTextureMap(e.target.result);
    };
    reader.readAsDataURL(file);
  } finally {
    viewerStore.removeStatus(statusId);
  }

  // Reset file input
  if (depthInputRef.value) {
    depthInputRef.value.value = "";
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Read file as data URL first
  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const statusId = viewerStore.showGenerating("Generating depth map...");

  try {
    // Generate depth map from image
    await imageStore.generateDepthMapFromImage(dataURL, file.name);
    // Set the original image as texture
    imageStore.setTextureMap(dataURL);
  } catch (error) {
    console.error("Error generating depth map:", error);
  } finally {
    viewerStore.removeStatus(statusId);
  }

  // Reset file input
  if (imageInputRef.value) {
    imageInputRef.value.value = "";
  }
}
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons" as *;

.input-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: visible; // Allow dropdowns to overflow
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: visible; // Allow dropdown menu to overflow
}

.section-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
  min-width: 90px;
}

.property-value {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary, #333);
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  overflow: visible; // Allow dropdown to overflow
}

.upload-button {
  @include btn-panel-action;
  width: 100%;
}

.generate-container {
  position: relative;
  display: flex;
  width: 100%;
  overflow: visible; // Allow dropdown menu to overflow
}

.generate-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px 0 0 6px;
  flex: 1;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
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
  font-size: 0.875rem;
  font-weight: 600;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
  }

  svg {
    font-size: 0.875rem;
  }
}

// Keep generate button and dropdown in sync on hover
.generate-container:hover {
  .generate-button,
  .generate-dropdown-btn {
    background: linear-gradient(135deg, #5568d3 0%, #64408a 100%);
  }
}

.model-menu {
  // Position is set dynamically via inline styles (fixed positioning)
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  z-index: 10000; // High z-index to appear above everything
}

.model-menu-section {
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid #e9ecef;
  }
}

.model-menu-label {
  font-size: 0.7rem;
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
    font-size: 0.8rem;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .model-desc {
    font-size: 0.7rem;
    color: #6c757d;
  }
}

.file-input-hidden {
  display: none;
}
</style>
