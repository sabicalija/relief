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
