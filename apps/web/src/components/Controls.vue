<template>
  <div class="controls" :class="{ disabled: !store.depthMap }">
    <h2>STL Parameters</h2>

    <!-- Basic Parameters -->
    <NumberInput
      v-model="store.targetDepthMm"
      label="Depth (mm)"
      :min="0.1"
      :step="0.1"
      hint="Maximum depth of the relief from surface to lowest point."
      @update:model-value="store.setTargetDepthMm"
    />

    <NumberInput
      v-model="store.baseThicknessMm"
      label="Base Thickness (mm)"
      :min="0"
      :step="0.1"
      hint="Solid base thickness for 3D printing stability."
      @update:model-value="store.setBaseThicknessMm"
    />

    <!-- Dimensions -->
    <div class="dimensions">
      <NumberInput
        v-model="store.targetWidthMm"
        label="Width (mm)"
        :min="1"
        placeholder="Auto"
        @update:model-value="store.setTargetWidthMm"
      />

      <NumberInput
        v-model="store.targetHeightMm"
        label="Height (mm)"
        :min="1"
        placeholder="Auto"
        @update:model-value="store.setTargetHeightMm"
      />
    </div>

    <!-- Resolution Control -->
    <ResolutionControl />

    <!-- Simplification -->
    <SimplificationSlider />

    <!-- Advanced Sections -->
    <DepthEnhancement />
    <ContourFlattening />
  </div>
</template>

<script setup>
import { useImageStore } from "../stores/image";
import NumberInput from "./controls/NumberInput.vue";
import ResolutionControl from "./controls/ResolutionControl.vue";
import SimplificationSlider from "./controls/SimplificationSlider.vue";
import DepthEnhancement from "./controls/DepthEnhancement.vue";
import ContourFlattening from "./controls/ContourFlattening.vue";

const store = useImageStore();
</script>

<style scoped lang="scss">
.controls {
  width: 100%;
  max-width: 1400px;
  margin: var(--spacing-lg) auto;
  padding: 1.25rem;
  background-color: var(--color-bg);
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  align-items: start;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
  }

  h2 {
    font-size: var(--font-size-xl);
    color: var(--color-text);
    margin: 0 0 var(--spacing-sm) 0;
    font-weight: var(--font-weight-semibold);
    grid-column: 1 / -1;
  }
}

.dimensions {
  display: contents;
}

@media (max-width: 1024px) {
  .controls {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
