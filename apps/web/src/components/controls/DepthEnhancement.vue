<template>
  <section class="advanced-section">
    <h3>
      <button @click="isOpen = !isOpen" class="toggle-btn">
        <span class="toggle-icon">{{ isOpen ? "▼" : "▶" }}</span>
        Advanced Depth Enhancement
      </button>
    </h3>

    <div v-if="isOpen" class="advanced-controls">
      <label class="checkbox-label">
        <input v-model="store.enhanceDetails" type="checkbox" />
        <span>Enable Detail Enhancement</span>
      </label>
      <p class="hint">Emphasize fine details while preserving major features for better 3D printing.</p>

      <template v-if="store.enhanceDetails">
        <div class="control-group">
          <label>
            Enhancement Strength
            <span class="value-display">{{ store.detailEnhancementStrength.toFixed(1) }}</span>
          </label>
          <input v-model.number="enhancementStrength" type="range" min="1.0" max="5.0" step="0.1" class="slider" />
          <p class="hint">How much to enhance fine details (1.0 = no enhancement, higher = more detail).</p>
        </div>

        <div class="control-group">
          <label>
            Detail Threshold
            <span class="value-display">{{ store.detailThreshold.toFixed(2) }}</span>
          </label>
          <input v-model.number="detailThreshold" type="range" min="0.0" max="1.0" step="0.01" class="slider" />
          <p class="hint">What counts as 'fine detail' vs 'major feature' (lower = more sensitive).</p>
        </div>

        <div class="control-group">
          <label>
            Smoothing Kernel Size
            <span class="value-display">{{ store.smoothingKernelSize }}</span>
          </label>
          <input v-model.number="smoothingKernel" type="range" min="1" max="15" step="2" class="slider" />
          <p class="hint">Noise reduction before enhancement (1 = none, higher = more smoothing).</p>
        </div>

        <label class="checkbox-label">
          <input v-model="store.preserveMajorFeatures" type="checkbox" />
          <span>Preserve Major Features</span>
        </label>
        <p class="hint">Keep large depth differences intact while enhancing fine details.</p>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "../../stores/image";

const store = useImageStore();
const isOpen = ref(false);

const enhancementStrength = ref(store.detailEnhancementStrength);
const detailThreshold = ref(store.detailThreshold);
const smoothingKernel = ref(store.smoothingKernelSize);

const updateEnhancement = useDebounceFn(() => store.setDetailEnhancementStrength(enhancementStrength.value), 300);
const updateThreshold = useDebounceFn(() => store.setDetailThreshold(detailThreshold.value), 300);
const updateKernel = useDebounceFn(() => store.setSmoothingKernelSize(smoothingKernel.value), 300);

watch(enhancementStrength, updateEnhancement);
watch(detailThreshold, updateThreshold);
watch(smoothingKernel, updateKernel);
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
