<template>
  <div class="material-panel">
    <!-- Appearance Section -->
    <div class="section">
      <div class="section-header">Appearance</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Item Color</label>
          <input type="color" class="color-input" :value="localColor" @input="updateItemColor" />
          <input
            type="text"
            class="color-text-input"
            :value="localColor"
            @input="updateItemColorText"
            pattern="#[0-9A-Fa-f]{6}"
            placeholder="#808080"
          />
        </div>
      </div>
    </div>

    <!-- Texture Section -->
    <div class="section">
      <div class="section-header">Texture</div>
      <div class="property-group">
        <!-- Texture preview (only show when texture is loaded) -->
        <div v-if="displayTexture" class="property-row">
          <label class="param-label">Preview</label>
          <div class="texture-preview-container">
            <img :src="displayTexture" class="texture-preview" alt="Texture preview" />
            <button class="clear-button-overlay" @click="clearTexture" title="Clear texture">
              <font-awesome-icon icon="times" />
            </button>
          </div>
        </div>

        <!-- Upload button (always visible) -->
        <button class="upload-button" @click="triggerFileInput">
          <font-awesome-icon icon="image" />
          <span>Load Texture</span>
        </button>
        <input
          type="file"
          class="file-input-hidden"
          accept="image/*"
          @change="handleTextureUpload"
          ref="fileInputRef"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "@/stores/image.js";

const imageStore = useImageStore();
const fileInputRef = ref(null);

// Local state for color input
const localColor = ref(imageStore.itemColor);

// Computed: Display custom texture if available, otherwise depth map if texture is enabled
const displayTexture = computed(() => {
  return imageStore.textureMap || (imageStore.showTexture ? imageStore.depthMap : null);
});

// Computed: Check if currently displaying a custom texture (not depth map)
const isCustomTexture = computed(() => {
  return imageStore.textureMap !== null;
});

// Debounced update function
const debouncedUpdateColor = useDebounceFn((value) => {
  imageStore.setItemColor(value);
}, 300);

function updateItemColor(event) {
  const value = event.target.value;
  localColor.value = value;
  debouncedUpdateColor(value);
}

function updateItemColorText(event) {
  const value = event.target.value;
  // Validate hex color format
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    localColor.value = value;
    debouncedUpdateColor(value);
  }
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function handleTextureUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setTextureMap(e.target.result);
      imageStore.setShowTexture(true);
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error loading texture:", error);
  }
}

function clearTexture() {
  if (isCustomTexture.value) {
    // Clear custom texture and disable texture display
    imageStore.clearTextureMap();
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  } else {
    // Clearing depth map texture - just disable texture display
    imageStore.setShowTexture(false);
  }
}

// Sync store changes back to local state
watch(
  () => imageStore.itemColor,
  (val) => {
    if (val !== localColor.value) localColor.value = val;
  }
);
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons" as *;

.material-panel {
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
  min-width: 70px;
}

.color-input {
  width: 40px;
  height: 28px;
  padding: 2px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }
}

.color-text-input {
  flex: 1;
  padding: 6px 8px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-primary, #333);
  font-family: "Segoe UI", system-ui, sans-serif;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
  }

  &:invalid {
    border-color: #dc3545;
  }
}

.file-input-hidden {
  display: none;
}

.upload-button {
  @include btn-panel-action;
  width: 100%;
}

.property-row + .upload-button {
  margin-top: 8px;
}

.checkbox-label {
  font-size: 13px;
  color: var(--text-primary, #333);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  span {
    user-select: none;
  }
}

.texture-preview-container {
  position: relative;
  flex: 1;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
}

.texture-preview {
  width: 100%;
  height: auto;
  display: block;
  max-height: 120px;
  object-fit: contain;
}

.clear-button-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: var(--text-secondary, #666);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(220, 53, 69, 0.95);
    border-color: #dc3545;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
  }
}

.info-row {
  padding: 6px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.info-text {
  font-size: 12px;
  color: var(--text-secondary, #999);
  font-style: italic;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clear-button {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: var(--text-secondary, #666);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(220, 53, 69, 0.1);
    border-color: #dc3545;
    color: #dc3545;
  }

  &:focus {
    outline: none;
    border-color: #dc3545;
    box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
  }
}
</style>
