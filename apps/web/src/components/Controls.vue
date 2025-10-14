<template>
  <div v-if="imageStore.depthMap" class="controls">
    <h2>STL Parameters</h2>

    <div class="control-group">
      <label for="target-depth">Depth (mm)</label>
      <input
        id="target-depth"
        type="number"
        min="0.1"
        step="0.1"
        :value="imageStore.targetDepthMm"
        @input="handleDepthChange"
        class="number-input"
      />
      <p class="hint">Maximum depth of the relief from surface to lowest point.</p>
    </div>

    <div class="control-group">
      <label for="base-thickness">Base Thickness (mm)</label>
      <input
        id="base-thickness"
        type="number"
        min="0"
        step="0.1"
        :value="imageStore.baseThicknessMm"
        @input="handleBaseThicknessChange"
        class="number-input"
      />
      <p class="hint">Solid base thickness for 3D printing stability.</p>
    </div>

    <div class="dimensions">
      <div class="control-group">
        <label for="target-width">Width (mm)</label>
        <input
          id="target-width"
          type="number"
          min="1"
          :value="imageStore.targetWidthMm"
          @input="handleWidthChange"
          placeholder="Auto"
          class="number-input"
        />
      </div>

      <div class="control-group">
        <label for="target-height">Height (mm)</label>
        <input
          id="target-height"
          type="number"
          min="1"
          :value="imageStore.targetHeightMm"
          @input="handleHeightChange"
          placeholder="Auto"
          class="number-input"
        />
      </div>
    </div>

    <div class="control-group resolution-control">
      <label>Resolution</label>
      <div class="resolution-display">
        <div class="resolution-info">
          <span class="resolution-label">Source:</span>
          <span class="resolution-value">{{ sourceResolution }} px</span>
        </div>
        <div class="resolution-info">
          <span class="resolution-label">Target:</span>
          <span class="resolution-value-editable">
            {{ targetResolutionPrefix }}×<input
              type="number"
              :min="minResolutionAllowed"
              :max="maxDimension"
              step="1"
              :value="imageStore.maxResolution"
              @input="handleResolutionChange"
              class="resolution-input"
            />
            px
          </span>
        </div>
        <div class="resolution-scale">
          <span class="resolution-label">Scale:</span>
          <div class="resolution-buttons">
            <button
              v-for="preset in resolutionPresets"
              :key="preset.value"
              @click="setResolution(preset.value)"
              :class="{ active: imageStore.maxResolution === preset.value }"
              class="btn-preset"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
      <p class="hint">Click a ratio preset to adjust mesh resolution. Lower values improve performance.</p>
    </div>

    <div class="control-group">
      <label for="simplification">
        Simplification
        <span class="simplification-value">{{ (localSimplificationRatio * 100).toFixed(0) }}%</span>
      </label>
      <input
        id="simplification"
        type="range"
        min="0.01"
        max="1"
        step="0.01"
        v-model.number="localSimplificationRatio"
        @change="handleSimplificationChange"
        class="slider"
      />
      <div class="simplification-presets">
        <button
          v-for="preset in simplificationPresets"
          :key="preset"
          @click="setSimplification(preset)"
          :class="{ active: Math.abs(localSimplificationRatio - preset) < 0.01 }"
          class="btn-preset"
        >
          {{ (preset * 100).toFixed(0) }}%
        </button>
      </div>
      <p class="hint">
        Reduce mesh complexity for smaller file sizes. Works by scaling down the effective resolution. 50% = half
        resolution, 10% = 1/10th resolution. Fast and responsive at any level.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useImageStore } from "../stores/image";

const imageStore = useImageStore();

// Local state for simplification slider (updates immediately for smooth UI)
const localSimplificationRatio = ref(1.0);

// Initialize from store
localSimplificationRatio.value = imageStore.simplificationRatio;

let simplificationDebounceTimer = null;

const handleDepthChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetDepthMm(event.target.value);
};

const handleBaseThicknessChange = (event) => {
  // Validation happens in the store
  imageStore.setBaseThicknessMm(event.target.value);
};

// Handler for slider change (mouse release) - triggers recalculation with debounce
const handleSimplificationChange = () => {
  if (simplificationDebounceTimer) {
    clearTimeout(simplificationDebounceTimer);
  }

  simplificationDebounceTimer = setTimeout(() => {
    imageStore.setSimplificationRatio(localSimplificationRatio.value);
  }, 300); // 300ms debounce after mouse release
};

// Direct setter for preset buttons (immediate, no debounce needed)
const setSimplification = (value) => {
  if (simplificationDebounceTimer) {
    clearTimeout(simplificationDebounceTimer);
  }
  localSimplificationRatio.value = value;
  imageStore.setSimplificationRatio(value);
};

// Simplification presets (10% to 100%)
const simplificationPresets = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const handleWidthChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetWidthMm(event.target.value);
};

const handleHeightChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetHeightMm(event.target.value);
};

const handleResolutionChange = (event) => {
  imageStore.setMaxResolution(event.target.value);
};

const setResolution = (value) => {
  imageStore.setMaxResolution(value);
};

// Get the maximum dimension from the image
const maxDimension = computed(() => {
  if (!imageStore.imageDimensions) return 4032;
  return Math.max(imageStore.imageDimensions.width, imageStore.imageDimensions.height);
});

// Minimum resolution allowed (1px for the larger dimension)
const minResolutionAllowed = computed(() => {
  return 1;
});

// Source resolution display
const sourceResolution = computed(() => {
  if (!imageStore.imageDimensions) return "N/A";
  return `${imageStore.imageDimensions.width}×${imageStore.imageDimensions.height}`;
});

// Target resolution prefix - the calculated dimension that's NOT the maxResolution
// For 3024×4032 with maxRes=1024 → shows "768"
const targetResolutionPrefix = computed(() => {
  if (!imageStore.imageDimensions) return "N/A";

  const { width, height } = imageStore.imageDimensions;
  const maxRes = imageStore.maxResolution;
  const maxDim = Math.max(width, height);

  // If image is smaller than maxResolution, use original size
  if (maxDim <= maxRes) {
    return `${width}×${height}`;
  }

  // Calculate the smaller dimension based on aspect ratio
  const scale = maxRes / maxDim;
  const targetWidth = Math.floor(width * scale);
  const targetHeight = Math.floor(height * scale);

  // Return the dimension that's NOT maxResolution
  // For 3024×4032 with maxRes=1024 → height is larger, so return width (768)
  if (height > width) {
    return targetWidth;
  } else {
    return targetHeight;
  }
});

// Generate resolution presets as ratios based on image size
const resolutionPresets = computed(() => {
  const max = maxDimension.value;
  const presets = [];

  // Generate halvings with ratio labels: 1:1, 1:2, 1:4, 1:8, 1:16, 1:32
  let current = max;
  let divisor = 1;
  while (current >= 128 && presets.length < 6) {
    const label = divisor === 1 ? "1:1" : `1:${divisor}`;
    presets.push({
      label: label,
      value: Math.round(current),
    });
    current = current / 2;
    divisor = divisor * 2;
  }

  return presets;
});
</script>

<style scoped>
.controls {
  width: 100%;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.controls h2 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  grid-column: 1 / -1;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group:last-child {
  margin-bottom: 0;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.simplification-value {
  font-weight: 500;
  color: #42b983;
  margin-left: 0.5rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #d3d3d3;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: none;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #666;
}

.hint {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}

.dimensions {
  display: contents;
}

.number-input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 2px solid #d3d3d3;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
}

.number-input:focus {
  border-color: #42b983;
}

.number-input::placeholder {
  color: #999;
}

.resolution-control {
  grid-column: 1 / -1;
}

.resolution-display {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.resolution-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.resolution-scale {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: 1rem;
}

.resolution-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.resolution-value {
  font-size: 1rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.resolution-value-editable {
  font-size: 1rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0;
}

.resolution-input {
  width: 70px;
  padding: 0.1rem 0.3rem;
  font-size: 1rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  color: #42b983;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid #42b983;
  border-radius: 0;
  outline: none;
  text-align: center;
  transition: border-color 0.2s;
}

.resolution-input:focus {
  border-bottom-color: #2c3e50;
  background-color: rgba(66, 185, 131, 0.15);
}

.resolution-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-preset {
  padding: 0.35rem 0.7rem;
  background-color: #e9ecef;
  color: #2c3e50;
  border: 2px solid #d3d3d3;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preset:hover {
  background-color: #dee2e6;
  border-color: #42b983;
}

.btn-preset.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.simplification-presets {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

@media (max-width: 1024px) {
  .controls {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
