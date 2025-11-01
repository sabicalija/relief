<template>
  <TresGroup v-if="mesh">
    <!-- Width measurement line (X axis) -->
    <primitive :object="widthLine" />
    <primitive v-if="widthArrows" :object="widthArrows" />

    <!-- Height measurement line (Z axis) -->
    <primitive :object="heightLine" />
    <primitive v-if="heightArrows" :object="heightArrows" />
  </TresGroup>
</template>
<script setup>
import { computed, watch, shallowRef } from "vue";
import * as THREE from "three";

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
  targetWidthMm: {
    type: Number,
    default: 100,
  },
  targetHeightMm: {
    type: Number,
    default: 100,
  },
});

const emit = defineEmits(["update:width", "update:height"]);

const widthLine = shallowRef(null);
const heightLine = shallowRef(null);
const widthArrows = shallowRef(null);
const heightArrows = shallowRef(null);

// Create measurement lines
function createMeasurementLine(start, end, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 3, // Thicker line
    depthTest: false, // Always visible
    transparent: true,
    opacity: 0.8,
  });
  const line = new THREE.Line(geometry, material);
  line.renderOrder = 999; // Render on top
  return line;
}

// Create arrow heads for measurement lines
function createArrowHeads(start, end, color) {
  const group = new THREE.Group();
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const arrowSize = 5; // 5mm arrow head size

  // Create cone geometry for arrow heads
  const coneGeometry = new THREE.ConeGeometry(arrowSize * 0.3, arrowSize * 0.4, 8);
  const coneMaterial = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
  });

  // Arrow at start (pointing outward from line)
  const arrowStart = new THREE.Mesh(coneGeometry, coneMaterial.clone());
  arrowStart.position.copy(start);
  arrowStart.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Cone points up by default
    direction.clone().negate() // Point away from line
  );
  arrowStart.renderOrder = 999;

  // Arrow at end (pointing outward from line)
  const arrowEnd = new THREE.Mesh(coneGeometry, coneMaterial.clone());
  arrowEnd.position.copy(end);
  arrowEnd.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Cone points up by default
    direction // Point away from line
  );
  arrowEnd.renderOrder = 999;

  group.add(arrowStart);
  group.add(arrowEnd);
  return group;
}

// Update measurement lines based on mesh
function updateMeasurements() {
  if (!props.mesh) return;

  const box = new THREE.Box3().setFromObject(props.mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Width line (along X axis, positioned at half height with padding)
  const widthZ = center.z + size.z / 2 + 10; // Half height + 10mm padding
  const widthY = center.y;
  const widthStart = new THREE.Vector3(box.min.x, widthY, widthZ);
  const widthEnd = new THREE.Vector3(box.max.x, widthY, widthZ);

  if (widthLine.value) {
    widthLine.value.geometry.dispose();
    widthLine.value.material.dispose();
  }
  if (widthArrows.value) {
    widthArrows.value.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
  widthLine.value = createMeasurementLine(widthStart, widthEnd, 0xff6b6b);
  widthArrows.value = createArrowHeads(widthStart, widthEnd, 0xff6b6b);

  // Height line (along Z axis, positioned at half width + padding)
  // Since mesh is rotated -90° on X, Z axis represents height
  const heightX = center.x + size.x / 2 + 10; // Half width + 10mm padding
  const heightStart = new THREE.Vector3(heightX, center.y, box.min.z);
  const heightEnd = new THREE.Vector3(heightX, center.y, box.max.z);

  if (heightLine.value) {
    heightLine.value.geometry.dispose();
    heightLine.value.material.dispose();
  }
  if (heightArrows.value) {
    heightArrows.value.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
  heightLine.value = createMeasurementLine(heightStart, heightEnd, 0x6b9fff);
  heightArrows.value = createArrowHeads(heightStart, heightEnd, 0x6b9fff);
}

// Watch for mesh changes
watch(() => props.mesh, updateMeasurements, { immediate: true });
watch([() => props.targetWidthMm, () => props.targetHeightMm], updateMeasurements);
</script>
