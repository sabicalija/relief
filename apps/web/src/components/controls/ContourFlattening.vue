<template>
  <section class="advanced-section">
    <h3>
      <button @click="isOpen = !isOpen" class="toggle-btn">
        <span class="toggle-icon">{{ isOpen ? "▼" : "▶" }}</span>
        Contour Flattening
      </button>
    </h3>

    <div v-if="isOpen" class="advanced-controls">
      <label class="checkbox-label">
        <input v-model="store.enableContour" type="checkbox" />
        <span>Enable Contour</span>
      </label>
      <p class="hint">Flatten all vertices above the threshold to create a flat top surface.</p>

      <div v-if="store.enableContour" class="control-group">
        <label>
          Threshold
          <span class="value-display">{{ (store.contourThreshold * 100).toFixed(0) }}%</span>
        </label>
        <input v-model.number="contourThreshold" type="range" min="0" max="1" step="0.01" class="slider" />
        <p class="hint">Depth threshold (0-100%). Vertices above this height will be flattened to the maximum depth.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "../../stores/image";

const store = useImageStore();
const isOpen = ref(false);
const contourThreshold = ref(store.contourThreshold);

const updateThreshold = useDebounceFn(() => store.setContourThreshold(contourThreshold.value), 300);
watch(contourThreshold, updateThreshold);
</script>

<style scoped>
.advanced-section {
  grid-column: 1 / -1;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
}

h3 {
  margin: 0 0 1rem 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #42b983;
}

.toggle-icon {
  font-size: 0.9rem;
  color: #42b983;
}

.advanced-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #42b983;
}

.value-display {
  float: right;
  color: #42b983;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #d3d3d3;
  outline: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
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

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}
</style>
