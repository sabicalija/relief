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

<style scoped>
.controls {
  width: 100%;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.controls.disabled {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

.controls h2 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  grid-column: 1 / -1;
}

.dimensions {
  display: contents;
}

@media (max-width: 1024px) {
  .controls {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
