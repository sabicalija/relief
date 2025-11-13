<template>
  <div class="view-panel">
    <!-- Grid Section -->
    <div class="section">
      <div class="section-header">Grid</div>
      <div class="property-group">
        <div class="property-row">
          <label class="checkbox-label">
            <input type="checkbox" :checked="viewerStore.showGrid" @change="toggleGrid" />
            <span>Show Grid</span>
          </label>
        </div>
      </div>

      <!-- Grid info and manual controls -->
      <div v-if="viewerStore.showGrid" class="property-group">
        <div class="info-row">
          <span class="info-text">{{ gridInfo }}</span>
        </div>

        <!-- Manual override controls -->
        <div class="property-row">
          <label class="param-label">Size</label>
          <input
            type="number"
            class="property-input"
            :value="viewerStore.gridSize ?? ''"
            @input="updateGridSize"
            step="10"
            min="10"
            :placeholder="String(autoGridSize)"
          />
          <span class="property-unit">mm</span>
        </div>
        <div class="property-row">
          <label class="param-label">Divisions</label>
          <input
            type="number"
            class="property-input"
            :value="viewerStore.gridDivisions ?? ''"
            @input="updateGridDivisions"
            step="1"
            min="1"
            :placeholder="String(autoGridDivisions)"
          />
        </div>
      </div>
    </div>

    <!-- Background Section -->
    <div class="section">
      <div class="section-header">Background</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Color</label>
          <input type="color" class="color-input" :value="viewerStore.backgroundColor" @input="updateBackgroundColor" />
          <input
            type="text"
            class="color-text-input"
            :value="viewerStore.backgroundColor"
            @input="updateBackgroundColorText"
            pattern="#[0-9A-Fa-f]{6}"
            placeholder="#f0f0f0"
          />
        </div>
      </div>
    </div>

    <!-- Lighting Section -->
    <div class="section">
      <div class="section-header">
        Lighting
        <button class="reset-button" @click="resetLighting" title="Reset to defaults">
          <font-awesome-icon icon="rotate-left" />
        </button>
      </div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Ambient</label>
          <span class="property-hint"></span>
          <input
            type="range"
            class="slider-input"
            :value="viewerStore.ambientLightIntensity"
            :style="{ '--slider-percent': `${((viewerStore.ambientLightIntensity ?? 1.5) / 3) * 100}%` }"
            @input="updateAmbientLight"
            min="0"
            max="3"
            step="0.1"
          />
          <span class="slider-value">{{ (viewerStore.ambientLightIntensity ?? 1.5).toFixed(1) }}</span>
        </div>

        <div class="property-row">
          <label class="param-label">Directional</label>
          <span class="property-hint"></span>
          <input
            type="range"
            class="slider-input"
            :value="viewerStore.directionalLightIntensity"
            :style="{ '--slider-percent': `${((viewerStore.directionalLightIntensity ?? 1.0) / 3) * 100}%` }"
            @input="updateDirectionalLight"
            min="0"
            max="3"
            step="0.1"
          />
          <span class="slider-value">{{ (viewerStore.directionalLightIntensity ?? 1.0).toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toRef, computed } from "vue";
import { useViewerStore } from "../../../../../stores/viewer";
import { useImageStore } from "../../../../../stores/image";
import { useGridSize, useGridDivisions } from "../../../../../composables/useGridSize";

const viewerStore = useViewerStore();
const imageStore = useImageStore();

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

// Use composable for grid calculations (without manual override to show auto values)
const autoGridSize = useGridSize({
  mesh: toRef(props, "mesh"),
  imageStore,
  manualSize: null, // Always calculate auto value for placeholder
});

const autoGridDivisions = useGridDivisions(autoGridSize, null);

const gridInfo = computed(() => {
  const hasManualOverride = viewerStore.gridSize !== null || viewerStore.gridDivisions !== null;
  if (hasManualOverride) {
    return "Manual override active (clear to use auto)";
  }
  if (imageStore.imageDimensions) {
    return "Grid auto-scales with mesh";
  }
  return "Using default grid size";
});

function toggleGrid(event) {
  viewerStore.setShowGrid(event.target.checked);
}

function updateGridSize(event) {
  const value = event.target.value.trim();
  if (value === "") {
    // Clear to use auto
    viewerStore.setGridSize(null);
  } else {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      viewerStore.setGridSize(parsed);
    }
  }
}

function updateGridDivisions(event) {
  const value = event.target.value.trim();
  if (value === "") {
    // Clear to use auto
    viewerStore.setGridDivisions(null);
  } else {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      viewerStore.setGridDivisions(parsed);
    }
  }
}

function updateBackgroundColor(event) {
  viewerStore.setBackgroundColor(event.target.value);
}

function updateBackgroundColorText(event) {
  const value = event.target.value;
  // Validate hex color format
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    viewerStore.setBackgroundColor(value);
  }
}

function updateAmbientLight(event) {
  const value = parseFloat(event.target.value);
  if (!isNaN(value)) {
    viewerStore.setAmbientLightIntensity(value);
  }
}

function updateDirectionalLight(event) {
  const value = parseFloat(event.target.value);
  if (!isNaN(value)) {
    viewerStore.setDirectionalLightIntensity(value);
  }
}

function resetLighting() {
  viewerStore.setAmbientLightIntensity(1.5);
  viewerStore.setDirectionalLightIntensity(1.0);
}
</script>

<style scoped lang="scss">
.view-panel {
  padding: 12px 8px 12px 12px; // Reduced right padding to account for scrollbar
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box; // Ensure padding is included in width
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0; // Allow flex children to shrink
  max-width: 100%; // Prevent overflow
  box-sizing: border-box;
}

.section-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reset-button {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text-primary, #333);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    font-size: 10px;
  }
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0; // Allow flex children to shrink
  max-width: 100%; // Prevent overflow
  box-sizing: border-box;
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
  }
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0; // Allow flex children to shrink below content size
  max-width: 100%; // Prevent overflow beyond parent container
  box-sizing: border-box;
  overflow: hidden; // Clip any overflow from children
}

.param-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
  min-width: 70px;
}

.property-input {
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
}

.property-unit {
  font-size: 12px;
  color: var(--text-secondary, #666);
  min-width: 30px;
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

.info-text {
  font-size: 12px;
  color: var(--text-secondary, #999);
  font-style: italic;
}

.info-row {
  padding: 6px 0;
}

.slider-input {
  flex: 1;
  min-width: 0; // Critical: allow range input to shrink in flex
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(
    to right,
    rgba(0, 102, 204, 0.2) 0%,
    rgba(0, 102, 204, 0.2) var(--slider-percent, 50%),
    rgba(0, 0, 0, 0.1) var(--slider-percent, 50%),
    rgba(0, 0, 0, 0.1) 100%
  );
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    background: white;
    border: 2px solid #0066cc;
    border-radius: 50%;
    cursor: grab;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }

    &:active {
      cursor: grabbing;
      transform: scale(1.05);
    }
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: white;
    border: 2px solid #0066cc;
    border-radius: 50%;
    cursor: grab;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }

    &:active {
      cursor: grabbing;
      transform: scale(1.05);
    }
  }

  &:focus {
    &::-webkit-slider-thumb {
      border-color: #0052a3;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
    }

    &::-moz-range-thumb {
      border-color: #0052a3;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.15);
    }
  }
}

.slider-value {
  font-size: 12px;
  color: var(--text-primary, #333);
  font-family: monospace;
  min-width: 28px;
  text-align: right;
  font-weight: 500;
}

.property-hint {
  font-size: 10px;
  color: var(--text-secondary, #aaa);
  font-style: italic;
  min-width: 20px;
  text-align: right;
  margin-right: 6px;
}
</style>
