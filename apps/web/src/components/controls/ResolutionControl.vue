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

<style lang="scss" scoped>
@use "../../styles/controls/buttons" as *;
@use "../../styles/controls/forms" as *;
@use "../../styles/controls/labels" as *;

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.resolution-control {
  grid-column: 1 / -1;
}

label {
  @include label-base;
}

.resolution-display {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  flex-wrap: wrap;
}

.resolution-info {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.resolution-scale {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  margin-left: var(--spacing-md);
}

.resolution-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: 0;
}

.resolution-value,
.resolution-value-editable {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  font-family: "Courier New", monospace;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  padding: 0.25rem var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.resolution-value-editable {
  display: flex;
  align-items: center;
  gap: 0;
}

.resolution-input {
  width: 70px;
  padding: 0.1rem 0.3rem;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  font-family: "Courier New", monospace;
  color: var(--color-primary);
  background-color: transparent;
  border: none;
  border-bottom: var(--input-border-width) solid var(--color-primary);
  border-radius: 0;
  outline: none;
  text-align: center;
  transition: border-color var(--transition-base), background-color var(--transition-base);

  &:focus {
    border-bottom-color: var(--color-text);
    background-color: rgba(66, 185, 131, 0.15);
  }
}

.resolution-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.btn-preset {
  @include btn-preset;
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: italic;
  margin: 0;
}
</style>
