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
  </div>
</template>

<script setup>
import { useImageStore } from "../stores/image";

const imageStore = useImageStore();

const handleDepthChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetDepthMm(event.target.value);
};

const handleBaseThicknessChange = (event) => {
  // Validation happens in the store
  imageStore.setBaseThicknessMm(event.target.value);
};

const handleWidthChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetWidthMm(event.target.value);
};

const handleHeightChange = (event) => {
  // Validation happens in the store
  imageStore.setTargetHeightMm(event.target.value);
};
</script>

<style scoped>
.controls {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.controls h2 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  margin-top: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.control-group:last-child {
  margin-bottom: 0;
}

label {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
</style>
