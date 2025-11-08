<template>
  <div class="item-panel">
    <!-- Location -->
    <div class="property-group">
      <div class="property-label">Location:</div>
      <div class="property-row">
        <label class="axis-label">X</label>
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
        <label class="axis-label">Y</label>
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
        <label class="axis-label">Z</label>
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

    <!-- Rotation -->
    <div class="property-group">
      <div class="property-label">Rotation:</div>
      <div class="property-row">
        <label class="axis-label">X</label>
        <input type="number" class="property-input" :value="rotation.x" @input="updateRotation('x', $event)" step="1" />
        <span class="property-unit">°</span>
      </div>
      <div class="property-row">
        <label class="axis-label">Y</label>
        <input type="number" class="property-input" :value="rotation.y" @input="updateRotation('y', $event)" step="1" />
        <span class="property-unit">°</span>
      </div>
      <div class="property-row">
        <label class="axis-label">Z</label>
        <input type="number" class="property-input" :value="rotation.z" @input="updateRotation('z', $event)" step="1" />
        <span class="property-unit">°</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

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
.item-panel {
  padding: 16px;
}

// Property groups
.property-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.property-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

// Property row (axis input)
.property-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.axis-label {
  min-width: 20px;
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.property-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  color: var(--text-primary, #333);
  font-size: 13px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  &:hover:not(:focus) {
    border-color: rgba(0, 0, 0, 0.25);
  }
}

.property-unit {
  min-width: 24px;
  font-size: 12px;
  color: #999;
}
</style>
