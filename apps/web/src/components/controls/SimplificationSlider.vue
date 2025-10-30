<template>
  <div class="control-group">
    <label>
      Simplification
      <span class="value-display">{{ (localValue * 100).toFixed(0) }}%</span>
    </label>
    <input v-model.number="localValue" type="range" min="0.01" max="1" step="0.01" class="slider" />
    <div class="presets">
      <button
        v-for="preset in presets"
        :key="preset"
        @click="setValue(preset)"
        :class="{ active: Math.abs(store.simplificationRatio - preset) < 0.01 }"
        class="btn-preset"
      >
        {{ (preset * 100).toFixed(0) }}%
      </button>
    </div>
    <p class="hint">
      Reduce mesh complexity for smaller file sizes. Works by scaling down the effective resolution. 50% = half
      resolution, 10% = 1/10th resolution.
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "../../stores/image";

const store = useImageStore();
const localValue = ref(store.simplificationRatio);
const presets = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const debouncedUpdate = useDebounceFn((value) => {
  store.setSimplificationRatio(value);
}, 300);

watch(localValue, debouncedUpdate);

const setValue = (value) => {
  localValue.value = value;
  store.setSimplificationRatio(value);
};
</script>

<style scoped>
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

.value-display {
  float: right;
  font-weight: 600;
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

.presets {
  display: flex;
  gap: 0.4rem;
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

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}
</style>
