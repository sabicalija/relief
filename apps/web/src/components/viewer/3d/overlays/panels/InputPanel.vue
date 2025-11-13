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

      <!-- Upload new image button -->
      <button class="upload-button" @click="triggerFileInput">
        <font-awesome-icon icon="upload" />
        <span>Load New Image</span>
      </button>
      <input type="file" class="file-input-hidden" accept="image/*" @change="handleFileUpload" ref="fileInputRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useImageStore } from "@/stores/image";
import { useViewerStore } from "@/stores/viewer";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const fileInputRef = ref(null);

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
function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Show loading status immediately before file reading starts
  const statusId = viewerStore.showGenerating("Loading depth map...");

  try {
    await imageStore.loadDepthMapFromFile(file);
  } finally {
    // Remove loading status - mesh generation watcher will show its own status
    viewerStore.removeStatus(statusId);
  }

  // Reset file input so the same file can be selected again
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
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
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.upload-button {
  @include btn-panel-action;
  width: 100%;
  margin-top: 8px;
}

.file-input-hidden {
  display: none;
}
</style>
