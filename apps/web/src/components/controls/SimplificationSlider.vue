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

<style scoped lang="scss">
@use "../../styles/controls/buttons" as *;
@use "../../styles/controls/forms" as *;
@use "../../styles/controls/labels" as *;
@use "../../styles/controls/utilities" as *;

.control-group {
  @include control-group;
}

label {
  @include label-base;
}

.value-display {
  @include value-display;
}

.slider {
  @include slider-input;
}

.presets {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.btn-preset {
  @include btn-preset;
}

.hint {
  @include hint-text;
}
</style>
