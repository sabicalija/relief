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

<style scoped lang="scss">
@use "../../styles/controls/forms" as *;
@use "../../styles/controls/labels" as *;
@use "../../styles/controls/utilities" as *;

.advanced-section {
  grid-column: 1 / -1;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 2px solid #e9ecef;
}

h3 {
  margin: 0 0 var(--spacing-md) 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
  transition: color var(--transition-base);

  &:hover {
    color: var(--color-primary);
  }
}

.toggle-icon {
  font-size: 0.9rem;
  color: var(--color-primary);
  transition: transform var(--transition-base);
}

.advanced-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.control-group {
  @include control-group;
}

label {
  @include label-base;
}

.checkbox-label {
  @include label-inline;

  input[type="checkbox"] {
    @include checkbox-base;
  }
}

.value-display {
  @include value-display;
}

.slider {
  @include slider-input;
}

.hint {
  @include hint-text;
}
</style>
