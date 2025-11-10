<template>
  <div class="quality-panel">
    <!-- Resolution Section -->
    <div class="section">
      <div class="section-header">Resolution</div>
      <div class="property-group">
        <div class="info-row" v-if="store.imageDimensions">
          <span class="info-label">Source</span>
          <span class="info-value">{{ sourceResolution }}</span>
        </div>
        <div class="info-row" v-if="store.imageDimensions">
          <span class="info-label">Target</span>
          <span class="info-value">{{ targetResolution }}</span>
        </div>
        <div class="slider-container">
          <div class="slider-header">
            <label class="slider-label">Max Dimension</label>
            <span class="slider-value">{{ store.maxResolution }} px</span>
          </div>
          <input
            v-model.number="localMaxResolution"
            type="range"
            :min="128"
            :max="maxDimension"
            step="1"
            class="slider"
            @input="debouncedUpdateResolution"
          />
          <div class="presets">
            <button
              v-for="preset in resolutionPresets"
              :key="preset.value"
              @click="setMaxResolution(preset.value)"
              :class="{ active: store.maxResolution === preset.value }"
              class="preset-btn"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
        <div class="slider-separator"></div>
        <div class="slider-container">
          <div class="slider-header">
            <label class="slider-label">Scale Factor</label>
            <span class="slider-value">{{ (localScaling * 100).toFixed(0) }}%</span>
          </div>
          <input
            v-model.number="localScaling"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            class="slider"
            @input="debouncedUpdateScaling"
          />
          <div class="presets">
            <button
              v-for="preset in scalingPresets"
              :key="preset"
              @click="setScaling(preset)"
              :class="{ active: Math.abs(store.simplificationRatio - preset) < 0.01 }"
              class="preset-btn"
            >
              {{ (preset * 100).toFixed(0) }}%
            </button>
          </div>
        </div>
        <p class="hint">
          Control mesh resolution before generation. Max Dimension sets the size limit, Scale Factor reduces it further.
          Lower values = faster generation and smaller files.
        </p>
      </div>
    </div>

    <!-- Simplification Section -->
    <div class="section">
      <div class="section-header">Simplification</div>
      <div class="property-group">
        <div v-if="isMeshTooLarge" class="warning-message">
          ⚠️ Mesh too large ({{ vertexCount.toLocaleString() }} vertices). Simplification disabled. Use Resolution
          instead.
        </div>
        <div class="slider-container" :class="{ disabled: isMeshTooLarge }">
          <div class="slider-header">
            <label class="slider-label">Triangle Reduction</label>
            <span class="slider-value">{{ (localSimplification * 100).toFixed(0) }}%</span>
          </div>
          <input
            v-model.number="localSimplification"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            class="slider"
            :disabled="isMeshTooLarge"
            @input="debouncedUpdateSimplification"
          />
          <div class="presets">
            <button
              v-for="preset in simplificationPresets"
              :key="preset"
              @click="setSimplification(preset)"
              :class="{ active: Math.abs(store.geometrySimplification - preset) < 0.01 }"
              :disabled="isMeshTooLarge"
              class="preset-btn"
            >
              {{ (preset * 100).toFixed(0) }}%
            </button>
          </div>
          <p class="hint">
            Post-processing reduction using edge collapse. Simplifies entire mesh including base and walls.
            <strong>For better performance and quality, use Resolution Scaling instead.</strong>
            <span v-if="store.geometrySimplification < 0.99" class="warning-text">
              ⚠️ Simplification removes textures and material groups.
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Mesh Statistics Section -->
    <div class="section" v-if="mesh">
      <div class="section-header">Statistics</div>
      <div class="property-group">
        <div class="stat-row">
          <span class="stat-label">Vertices</span>
          <span class="stat-value">{{ vertexCount.toLocaleString() }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Triangles</span>
          <span class="stat-value">{{ triangleCount.toLocaleString() }}</span>
        </div>
        <div class="stat-row" v-if="mesh.userData.resolution">
          <span class="stat-label">Grid</span>
          <span class="stat-value">{{ mesh.userData.resolution.width }} × {{ mesh.userData.resolution.height }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useImageStore } from "../../../../../stores/image";

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

const store = useImageStore();

// Resolution controls
const localMaxResolution = ref(store.maxResolution);
const localScaling = ref(store.simplificationRatio);

// Geometry simplification controls
const localSimplification = ref(store.geometrySimplification);

const scalingPresets = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const simplificationPresets = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

// Debounced updates
const debouncedUpdateResolution = useDebounceFn(() => {
  store.setMaxResolution(localMaxResolution.value);
}, 300);

const debouncedUpdateScaling = useDebounceFn(() => {
  store.setSimplificationRatio(localScaling.value);
}, 300);

const debouncedUpdateSimplification = useDebounceFn(() => {
  store.setGeometrySimplification(localSimplification.value);
}, 300);

// Preset setters
const setMaxResolution = (value) => {
  localMaxResolution.value = value;
  store.setMaxResolution(value);
};

const setScaling = (value) => {
  localScaling.value = value;
  store.setSimplificationRatio(value);
};

const setSimplification = (value) => {
  localSimplification.value = value;
  store.setGeometrySimplification(value);
};

// Resolution calculations
const maxDimension = computed(() => {
  if (!store.imageDimensions) return 4032;
  return Math.max(store.imageDimensions.width, store.imageDimensions.height);
});

const sourceResolution = computed(() => {
  if (!store.imageDimensions) return "N/A";
  return `${store.imageDimensions.width}×${store.imageDimensions.height}`;
});

const targetResolution = computed(() => {
  if (!store.imageDimensions) return "N/A";
  const { width, height } = store.imageDimensions;
  const scale = store.maxResolution / maxDimension.value;
  const targetWidth = Math.floor(width * scale * store.simplificationRatio);
  const targetHeight = Math.floor(height * scale * store.simplificationRatio);
  return `${targetWidth}×${targetHeight}`;
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

// Compute mesh statistics
const vertexCount = computed(() => {
  if (!props.mesh?.geometry?.attributes?.position) return 0;
  return props.mesh.geometry.attributes.position.count;
});

const triangleCount = computed(() => {
  if (!props.mesh?.geometry?.index) return 0;
  return props.mesh.geometry.index.count / 3;
});

// Check if mesh is too large for simplification
const isMeshTooLarge = computed(() => {
  return vertexCount.value > 100000;
});
</script>

<style scoped lang="scss">
.quality-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  overflow-y: auto;
  max-height: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  font-weight: 600;
  font-size: 12px;
  color: var(--text-primary, #333);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 3px;
  font-size: 12px;
}

.info-label {
  color: var(--text-secondary, #666);
  font-weight: 500;
}

.info-value {
  color: var(--text-primary, #333);
  font-weight: 600;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.slider-separator {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
  margin: 4px 0;
}

.warning-message {
  padding: 8px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 4px;
  font-size: 11px;
  color: #856404;
  line-height: 1.4;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.slider-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary, #42b983);
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}

.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  outline: none;
  cursor: pointer;
  appearance: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary, #42b983);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 0 4px rgba(66, 185, 131, 0.2);
    }
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: var(--color-primary, #42b983);
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 0 0 4px rgba(66, 185, 131, 0.2);
    }
  }
}

.presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #666;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.25);
  }

  &.active {
    background: var(--color-primary, #42b983);
    border-color: var(--color-primary, #42b983);
    color: white;
  }
}

.hint {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
  margin: 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.stat-label {
  color: var(--text-secondary, #666);
  font-weight: 500;
}

.stat-value {
  color: var(--text-primary, #333);
  font-weight: 600;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
}
</style>
