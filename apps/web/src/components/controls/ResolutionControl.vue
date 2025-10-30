<template>
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
            v-model.number="localResolution"
            type="number"
            :min="1"
            :max="maxDimension"
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
            @click="store.setMaxResolution(preset.value)"
            :class="{ active: store.maxResolution === preset.value }"
            class="btn-preset"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>
    <p class="hint">Click a ratio preset to adjust mesh resolution. Lower values improve performance.</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "../../stores/image";

const store = useImageStore();
const localResolution = ref(store.maxResolution);

const debouncedUpdate = useDebounceFn((value) => {
  store.setMaxResolution(value);
}, 500);

watch(localResolution, debouncedUpdate);
watch(
  () => store.maxResolution,
  (val) => {
    if (val !== localResolution.value) localResolution.value = val;
  }
);

const maxDimension = computed(() => {
  if (!store.imageDimensions) return 4032;
  return Math.max(store.imageDimensions.width, store.imageDimensions.height);
});

const sourceResolution = computed(() => {
  if (!store.imageDimensions) return "N/A";
  return `${store.imageDimensions.width}×${store.imageDimensions.height}`;
});

const targetResolutionPrefix = computed(() => {
  if (!store.imageDimensions) return "N/A";
  const { width, height } = store.imageDimensions;
  const scale = store.maxResolution / maxDimension.value;
  const targetWidth = Math.floor(width * scale);
  const targetHeight = Math.floor(height * scale);
  return height > width ? targetWidth : targetHeight;
});

const resolutionPresets = computed(() => {
  const presets = [];
  let current = maxDimension.value;
  let divisor = 1;
  while (current >= 128 && presets.length < 6) {
    presets.push({
      label: divisor === 1 ? "1:1" : `1:${divisor}`,
      value: Math.round(current),
    });
    current = current / 2;
    divisor = divisor * 2;
  }
  return presets;
});
</script>

<style scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resolution-control {
  grid-column: 1 / -1;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
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
