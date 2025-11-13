<template>
  <div class="processing-panel">
    <!-- Depth Enhancement Section -->
    <div class="section">
      <div class="section-header">Depth Enhancement</div>
      <div class="property-group">
        <div class="property-row checkbox-row">
          <label class="checkbox-label">
            <input v-model="store.enhanceDetails" type="checkbox" class="checkbox-input" />
            <span class="checkbox-text">Enable Enhancement</span>
          </label>
        </div>
        <p class="hint">Emphasize fine details while preserving major features for better 3D printing.</p>

        <!-- Enhancement controls (shown when enabled) -->
        <template v-if="store.enhanceDetails">
          <div class="slider-container">
            <div class="slider-header">
              <label class="slider-label">Strength</label>
              <span class="slider-value">{{ localEnhancementStrength.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="localEnhancementStrength"
              type="range"
              min="0.0"
              max="2.0"
              step="0.05"
              class="slider"
              @input="debouncedUpdateEnhancementStrength"
            />
            <p class="hint">Enhancement intensity (0 = none, 1 = full equalization, >1 = over-enhancement).</p>
          </div>

          <div class="slider-container">
            <div class="slider-header">
              <label class="slider-label">Detail Threshold</label>
              <span class="slider-value">{{ localDetailThreshold.toFixed(2) }}</span>
            </div>
            <input
              v-model.number="localDetailThreshold"
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              class="slider"
              @input="debouncedUpdateDetailThreshold"
            />
            <p class="hint">What counts as 'fine detail' vs 'major feature' (lower = more sensitive).</p>
          </div>

          <div class="slider-container">
            <div class="slider-header">
              <label class="slider-label">Smoothing Kernel</label>
              <span class="slider-value">{{ localSmoothingKernel }}</span>
            </div>
            <input
              v-model.number="localSmoothingKernel"
              type="range"
              min="1"
              max="15"
              step="2"
              class="slider"
              @input="debouncedUpdateSmoothingKernel"
            />
            <p class="hint">Noise reduction before enhancement (1 = none, higher = more smoothing).</p>
          </div>

          <div class="property-row checkbox-row">
            <label class="checkbox-label">
              <input v-model="store.preserveMajorFeatures" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">Preserve Major Features</span>
            </label>
          </div>
          <p class="hint">Keep large depth differences intact while enhancing fine details.</p>
          <!-- Reset button (shown when enabled) -->
          <button
            class="reset-enhancement-button"
            @click="resetEnhancements"
            title="Reset to defaults (minimal enhancement)"
          >
            <font-awesome-icon icon="rotate" />
            <span>Reset</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Contour Flattening Section -->
    <div class="section">
      <div class="section-header">Contour Flattening</div>
      <div class="property-group">
        <div class="property-row checkbox-row">
          <label class="checkbox-label">
            <input v-model="store.enableContour" type="checkbox" class="checkbox-input" />
            <span class="checkbox-text">Enable Contour</span>
          </label>
        </div>
        <p class="hint">Flatten vertices above or below the threshold.</p>

        <!-- Contour controls (shown when enabled) -->
        <template v-if="store.enableContour">
          <div class="contour-layout">
            <!-- Left: Flatten mode checkboxes -->
            <div class="contour-controls">
              <div class="property-row checkbox-row">
                <label class="checkbox-label">
                  <input
                    v-model="store.flattenAboveThreshold"
                    type="checkbox"
                    class="checkbox-input"
                    @change="store.setFlattenAboveThreshold($event.target.checked)"
                  />
                  <span class="checkbox-text">Above</span>
                </label>
              </div>
              <p class="hint compact">→ max</p>

              <div class="property-row checkbox-row">
                <label class="checkbox-label">
                  <input
                    v-model="store.flattenBelowThreshold"
                    type="checkbox"
                    class="checkbox-input"
                    @change="store.setFlattenBelowThreshold($event.target.checked)"
                  />
                  <span class="checkbox-text">Below</span>
                </label>
              </div>
              <p class="hint compact">→ zero</p>
            </div>

            <!-- Right: Vertical threshold slider -->
            <div class="contour-slider">
              <span class="slider-value">{{ (localContourThreshold * 100).toFixed(0) }}%</span>
              <div class="vertical-slider-wrapper">
                <input
                  v-model.number="localContourThreshold"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  class="slider vertical-slider"
                  orient="vertical"
                  @input="debouncedUpdateContourThreshold"
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "@/stores/image.js";

const store = useImageStore();

// Local state for sliders (for immediate UI feedback)
const localEnhancementStrength = ref(store.detailEnhancementStrength);
const localDetailThreshold = ref(store.detailThreshold);
const localSmoothingKernel = ref(store.smoothingKernelSize);
const localContourThreshold = ref(store.contourThreshold);

// Debounced updates to store (to avoid triggering mesh regeneration on every slider movement)
const debouncedUpdateEnhancementStrength = useDebounceFn(() => {
  store.setDetailEnhancementStrength(localEnhancementStrength.value);
}, 300);

const debouncedUpdateDetailThreshold = useDebounceFn(() => {
  store.setDetailThreshold(localDetailThreshold.value);
}, 300);

const debouncedUpdateSmoothingKernel = useDebounceFn(() => {
  store.setSmoothingKernelSize(localSmoothingKernel.value);
}, 300);

const debouncedUpdateContourThreshold = useDebounceFn(() => {
  store.setContourThreshold(localContourThreshold.value);
}, 300);

// Reset functions
function resetEnhancements() {
  // Reset to default values (full equalization with standard settings)
  // Don't toggle enhanceDetails - let user control that manually
  localEnhancementStrength.value = 1.0; // 1.0 = full equalization
  store.setDetailEnhancementStrength(1.0);
  localDetailThreshold.value = 0.1;
  store.setDetailThreshold(0.1);
  localSmoothingKernel.value = 3; // 3 = moderate smoothing
  store.setSmoothingKernelSize(3);
  store.preserveMajorFeatures = true;
}

function resetContour() {
  // Reset to default values (both flatten modes enabled)
  localContourThreshold.value = 0.8;
  store.setContourThreshold(0.8);
  store.setFlattenAboveThreshold(true);
  store.setFlattenBelowThreshold(true);
}
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons" as *;

.processing-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.reset-enhancement-button {
  @include btn-panel-action;
  width: 100%;
  margin-top: 0.75rem;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-row {
  margin-top: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  accent-color: #42b983;
}

.checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.slider-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #42b983;
  font-family: "Courier New", monospace;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #42b983;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: #359268;
      transform: scale(1.1);
    }
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #42b983;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;

    &:hover {
      background: #359268;
      transform: scale(1.1);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &::-webkit-slider-thumb {
      cursor: not-allowed;
    }

    &::-moz-range-thumb {
      cursor: not-allowed;
    }
  }
}

.vertical-slider-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  position: relative;
}

.vertical-slider {
  width: 120px;
  height: 6px;
  margin: 0;
  transform: rotate(-90deg);
  transform-origin: center;
  position: absolute;

  &::-webkit-slider-thumb {
    &:hover {
      transform: scale(1.1);
    }
  }

  &::-moz-range-thumb {
    &:hover {
      transform: scale(1.1);
    }
  }
}

.contour-layout {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 1rem;
  margin-top: 0.75rem;
  align-items: center;
}

.contour-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: auto;

  .checkbox-row {
    margin: 0;
  }

  .checkbox-label {
    gap: 0.5rem;
  }

  .checkbox-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .hint.compact {
    margin: -0.5rem 0 0 1.75rem;
    font-size: 0.7rem;
    color: #9ca3af;
  }
}

.contour-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  .slider-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    font-family: "Courier New", monospace;
  }
}

.hint {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
