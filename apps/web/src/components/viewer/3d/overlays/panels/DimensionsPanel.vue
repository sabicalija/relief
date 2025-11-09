<template>
  <div class="dimensions-panel">
    <!-- Size Section -->
    <div class="section">
      <div class="section-header">Size</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Width</label>
          <input
            type="number"
            class="property-input"
            v-model="localWidth"
            :placeholder="actualMeshDimensions.width.toFixed(1)"
            min="1"
            step="1"
            @focus="handleFocus('width')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>
        <p class="property-hint">X-axis (horizontal)</p>

        <div class="property-row">
          <label class="param-label">Height</label>
          <input
            type="number"
            class="property-input"
            v-model="localHeight"
            :placeholder="actualMeshDimensions.height.toFixed(1)"
            min="1"
            step="1"
            @focus="handleFocus('height')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>
        <p class="property-hint">Y-axis (vertical)</p>
      </div>
    </div>

    <!-- Relief Section -->
    <div class="section">
      <div class="section-header">Relief</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Depth</label>
          <input
            type="number"
            class="property-input"
            v-model="localDepth"
            min="0.1"
            step="0.1"
            @focus="handleFocus('depth')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>
        <p class="property-hint">Z-axis (depth)</p>

        <div class="property-row">
          <label class="param-label">Base</label>
          <input
            type="number"
            class="property-input"
            v-model="localBaseThickness"
            min="0"
            step="0.1"
            @focus="handleFocus('baseThickness')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>
        <p class="property-hint">Z-axis (below surface)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "@/stores/image.js";
import { useViewerStore } from "@/stores/viewer.js";
import { calculateMeshDimensions } from "@/utils/image/processing.js";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

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

// Show specific measurement when user focuses dimension input
function handleFocus(dimension) {
  viewerStore.setActiveDimensionMeasurement(dimension);
}

// Hide measurements when user blurs any dimension input
function handleBlur() {
  viewerStore.setActiveDimensionMeasurement(null);
}

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
  gap: 20px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #333);
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
  min-width: 70px;
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
  color: var(--text-secondary, #666);
  min-width: 30px;
}

.property-hint {
  font-size: 11px;
  color: var(--text-secondary, #999);
  margin: 0;
  font-style: italic;
  padding-left: 78px; /* Align with input (70px label + 8px gap) */
}
</style>
