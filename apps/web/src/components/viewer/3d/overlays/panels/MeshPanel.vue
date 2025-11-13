<template>
  <div class="mesh-panel">
    <!-- Location Section -->
    <div class="section">
      <div class="section-header">Location</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">X</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="location.x"
            @input="updateLocation('x', $event)"
            step="0.1"
          />
          <span class="property-unit">mm</span>
        </div>
        <div class="property-row">
          <label class="param-label">Y</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="location.y"
            @input="updateLocation('y', $event)"
            step="0.1"
          />
          <span class="property-unit">mm</span>
        </div>
        <div class="property-row">
          <label class="param-label">Z</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="location.z"
            @input="updateLocation('z', $event)"
            step="0.1"
          />
          <span class="property-unit">mm</span>
        </div>
      </div>
    </div>

    <!-- Rotation Section -->
    <div class="section">
      <div class="section-header">Rotation</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">X</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="rotation.x"
            @input="updateRotation('x', $event)"
            step="1"
          />
          <span class="property-unit">°</span>
        </div>
        <div class="property-row">
          <label class="param-label">Y</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="rotation.y"
            @input="updateRotation('y', $event)"
            step="1"
          />
          <span class="property-unit">°</span>
        </div>
        <div class="property-row">
          <label class="param-label">Z</label>
          <span class="property-hint"></span>
          <input
            type="number"
            class="property-input"
            :value="rotation.z"
            @input="updateRotation('z', $event)"
            step="1"
          />
          <span class="property-unit">°</span>
        </div>
      </div>
    </div>

    <!-- Size Section -->
    <div class="section">
      <div class="section-header">Size</div>
      <div class="property-group">
        <div class="property-row">
          <label class="param-label">Width</label>
          <span class="property-hint">X</span>
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

        <div class="property-row">
          <label class="param-label">Height</label>
          <span class="property-hint">Y</span>
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

        <div class="property-row">
          <label class="param-label">Depth</label>
          <span class="property-hint">Z</span>
          <input
            type="number"
            class="property-input"
            v-model="localDepth"
            :placeholder="defaultDepth.toFixed(1)"
            min="0"
            step="0.1"
            @focus="handleFocus('depth')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>

        <div class="property-row">
          <label class="param-label">Base</label>
          <span class="property-hint">-Z</span>
          <input
            type="number"
            class="property-input"
            v-model="localBaseThickness"
            :placeholder="defaultBaseThickness.toFixed(1)"
            min="0"
            step="0.1"
            @focus="handleFocus('baseThickness')"
            @blur="handleBlur"
          />
          <span class="property-unit">mm</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted, onUnmounted, ref, computed } from "vue";
import { useDebounceFn } from "@vueuse/core";
import * as THREE from "three";
import { useImageStore } from "@/stores/image.js";
import { useViewerStore } from "@/stores/viewer.js";
import { calculateMeshDimensions } from "@/utils/image/processing.js";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

// Default values from state.js
const defaultDepth = 20.0; // mm
const defaultBaseThickness = 10.0; // mm

// Local state for debounced updates (dimensions)
const localWidth = ref(imageStore.targetWidthMm);
const localHeight = ref(imageStore.targetHeightMm);
const localDepth = ref(imageStore.targetDepthMm);
const localBaseThickness = ref(imageStore.baseThicknessMm);

// Compute actual mesh dimensions based on current image and config
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

// Debounced update functions for dimensions
const debouncedUpdateWidth = useDebounceFn((value) => {
  imageStore.setTargetWidthMm(value === "" ? null : value);
}, 500);

const debouncedUpdateHeight = useDebounceFn((value) => {
  imageStore.setTargetHeightMm(value === "" ? null : value);
}, 500);

const debouncedUpdateDepth = useDebounceFn((value) => {
  imageStore.setTargetDepthMm(value === "" ? defaultDepth : value);
}, 500);

const debouncedUpdateBaseThickness = useDebounceFn((value) => {
  imageStore.setBaseThicknessMm(value === "" ? defaultBaseThickness : value);
}, 500);

// Watch local values and trigger debounced updates
watch(localWidth, (value) => {
  debouncedUpdateWidth(value);
});

watch(localHeight, (value) => {
  debouncedUpdateHeight(value);
});

watch(localDepth, (value) => {
  debouncedUpdateDepth(value);
});

watch(localBaseThickness, (value) => {
  debouncedUpdateBaseThickness(value);
});

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

// Handle focus/blur for dimension measurement display
const handleFocus = (dimensionType) => {
  viewerStore.setActiveDimensionMeasurement(dimensionType);
};

const handleBlur = () => {
  viewerStore.setActiveDimensionMeasurement(null);
};

// Transform properties - synced with mesh
const location = reactive({
  x: 0,
  y: 0,
  z: 0,
});

const rotation = reactive({
  x: 0,
  y: 0,
  z: 0,
});

// Track if user is actively typing
const isUserEditing = ref(false);
let editTimeout = null;

// Default mesh rotation (the "identity" orientation for this app)
// With Blender coordinate system (Z-up), mesh is generated in correct orientation
const DEFAULT_ROTATION = {
  x: 0,
  y: 0,
  z: 0,
};

// Create a quaternion for the default rotation
const defaultQuaternion = new THREE.Quaternion();
const defaultEuler = new THREE.Euler(DEFAULT_ROTATION.x, DEFAULT_ROTATION.y, DEFAULT_ROTATION.z, "XYZ");
defaultQuaternion.setFromEuler(defaultEuler);

// Inverse of default quaternion to calculate relative rotation
const defaultQuaternionInverse = defaultQuaternion.clone().invert();

// Helper objects for calculations
const meshQuaternion = new THREE.Quaternion();
const relativeQuaternion = new THREE.Quaternion();
const relativeEuler = new THREE.Euler();

// Update local state from mesh
function syncFromMesh() {
  if (!props.mesh || isUserEditing.value) return;

  // Update location
  if (props.mesh.position) {
    location.x = Math.round(props.mesh.position.x * 100) / 100;
    location.y = Math.round(props.mesh.position.y * 100) / 100;
    location.z = Math.round(props.mesh.position.z * 100) / 100;
  }

  // Update rotation using quaternions to avoid gimbal lock issues
  if (props.mesh.rotation) {
    // Get mesh's current quaternion
    meshQuaternion.setFromEuler(props.mesh.rotation);

    // Calculate relative rotation: relative = inverse(default) * current
    relativeQuaternion.multiplyQuaternions(defaultQuaternionInverse, meshQuaternion);

    // Convert back to Euler angles
    relativeEuler.setFromQuaternion(relativeQuaternion, "XYZ");

    // Convert to degrees and update display
    rotation.x = Math.round(((relativeEuler.x * 180) / Math.PI) * 100) / 100;
    rotation.y = Math.round(((relativeEuler.y * 180) / Math.PI) * 100) / 100;
    rotation.z = Math.round(((relativeEuler.z * 180) / Math.PI) * 100) / 100;
  }
}

// Poll for changes (to catch transform control updates)
let pollInterval = null;

onMounted(() => {
  syncFromMesh();
  // Poll every frame for smooth updates when using transform controls
  pollInterval = setInterval(syncFromMesh, 16); // ~60fps
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});

// Watch for mesh changes
watch(() => props.mesh, syncFromMesh, { immediate: true });

// Update handlers
function updateLocation(axis, event) {
  const value = parseFloat(event.target.value) || 0;
  location[axis] = value;

  if (props.mesh) {
    props.mesh.position[axis] = value;
  }
}

function updateRotation(axis, event) {
  // Mark as user editing
  isUserEditing.value = true;
  clearTimeout(editTimeout);

  const degrees = parseFloat(event.target.value) || 0;
  rotation[axis] = degrees;

  if (props.mesh) {
    // Create relative rotation from user input
    relativeEuler.set((rotation.x * Math.PI) / 180, (rotation.y * Math.PI) / 180, (rotation.z * Math.PI) / 180, "XYZ");
    relativeQuaternion.setFromEuler(relativeEuler);

    // Combine with default: final = default * relative
    meshQuaternion.multiplyQuaternions(defaultQuaternion, relativeQuaternion);

    // Set mesh rotation from combined quaternion
    props.mesh.rotation.setFromQuaternion(meshQuaternion);
  }

  // Resume syncing after a short delay
  editTimeout = setTimeout(() => {
    isUserEditing.value = false;
  }, 100);
}
</script>

<style scoped lang="scss">
.mesh-panel {
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
  text-align: left;
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
}

.property-unit {
  font-size: 12px;
  color: var(--text-secondary, #666);
  min-width: 30px;
}

.property-hint {
  font-size: 10px;
  color: var(--text-secondary, #aaa);
  font-style: italic;
  min-width: 20px;
  text-align: right;
  margin-right: 6px;
}
</style>
