<template>
  <div class="dimensions-panel">
    <!-- Width -->
    <div class="property-group">
      <div class="property-label">Width:</div>
      <div class="property-row">
        <input
          type="number"
          class="property-input"
          v-model="localWidth"
          :placeholder="actualMeshDimensions.width.toFixed(1)"
          min="1"
          step="1"
        />
        <span class="property-unit">mm</span>
      </div>
      <p class="property-hint">X-axis (horizontal)</p>
    </div>

    <!-- Height -->
    <div class="property-group">
      <div class="property-label">Height:</div>
      <div class="property-row">
        <input
          type="number"
          class="property-input"
          v-model="localHeight"
          :placeholder="actualMeshDimensions.height.toFixed(1)"
          min="1"
          step="1"
        />
        <span class="property-unit">mm</span>
      </div>
      <p class="property-hint">Z-axis (vertical)</p>
    </div>

    <!-- Depth -->
    <div class="property-group">
      <div class="property-label">Depth:</div>
      <div class="property-row">
        <input type="number" class="property-input" v-model="localDepth" min="0.1" step="0.1" />
        <span class="property-unit">mm</span>
      </div>
      <p class="property-hint">Y-axis (relief height)</p>
    </div>

    <!-- Base Thickness -->
    <div class="property-group">
      <div class="property-label">Base Thickness:</div>
      <div class="property-row">
        <input type="number" class="property-input" v-model="localBaseThickness" min="0" step="0.1" />
        <span class="property-unit">mm</span>
      </div>
      <p class="property-hint">Solid base below relief</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "@/stores/image.js";
import { calculateMeshDimensions } from "@/utils/image/processing.js";

const imageStore = useImageStore();

// Local state for inputs
const localWidth = ref(imageStore.targetWidthMm);
const localHeight = ref(imageStore.targetHeightMm);
const localDepth = ref(imageStore.targetDepthMm);
const localBaseThickness = ref(imageStore.baseThicknessMm);

// Calculate actual mesh dimensions (what the mesh will be)
const actualMeshDimensions = computed(() => {
  if (!imageStore.imageDimensions) {
    return { width: 100, height: 100 };
  }

  const aspectRatio = imageStore.imageDimensions.width / imageStore.imageDimensions.height;
  const { meshWidth, meshHeight } = calculateMeshDimensions(
    aspectRatio,
    imageStore.targetWidthMm,
    imageStore.targetHeightMm
  );

  return { width: meshWidth, height: meshHeight };
});

// Debounced update functions
const debouncedUpdateWidth = useDebounceFn((value) => {
  imageStore.setTargetWidthMm(value === "" ? null : value);
}, 500);

const debouncedUpdateHeight = useDebounceFn((value) => {
  imageStore.setTargetHeightMm(value === "" ? null : value);
}, 500);

const debouncedUpdateDepth = useDebounceFn((value) => {
  imageStore.setTargetDepthMm(value);
}, 500);

const debouncedUpdateBaseThickness = useDebounceFn((value) => {
  imageStore.setBaseThicknessMm(value);
}, 500);

// Watch local state and debounce updates
watch(localWidth, (value) => debouncedUpdateWidth(value));
watch(localHeight, (value) => debouncedUpdateHeight(value));
watch(localDepth, (value) => debouncedUpdateDepth(value));
watch(localBaseThickness, (value) => debouncedUpdateBaseThickness(value));

// Sync store changes back to local state
watch(
  () => imageStore.targetWidthMm,
  (val) => {
    if (val !== localWidth.value) localWidth.value = val;
  }
);
watch(
  () => imageStore.targetHeightMm,
  (val) => {
    if (val !== localHeight.value) localHeight.value = val;
  }
);
watch(
  () => imageStore.targetDepthMm,
  (val) => {
    if (val !== localDepth.value) localDepth.value = val;
  }
);
watch(
  () => imageStore.baseThicknessMm,
  (val) => {
    if (val !== localBaseThickness.value) localBaseThickness.value = val;
  }
);
</script>

<style scoped lang="scss">
.dimensions-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #333);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
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

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }
}

.property-unit {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 24px;
  text-align: left;
}

.property-hint {
  font-size: 11px;
  color: #666;
  margin: 0;
  font-style: italic;
}
</style>
