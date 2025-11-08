<template>
  <!-- Show only the active dimension measurement -->
  <TresGroup v-if="viewerStore.activeDimensionMeasurement && mesh">
    <!-- Width measurement line (X axis) - shown when editing width -->
    <template v-if="viewerStore.activeDimensionMeasurement === 'width' && widthLine">
      <primitive :object="widthLine" />
      <primitive v-if="widthArrows" :object="widthArrows" />
    </template>

    <!-- Height measurement line (Y axis) - shown when editing height -->
    <template v-if="viewerStore.activeDimensionMeasurement === 'height' && heightLine">
      <primitive :object="heightLine" />
      <primitive v-if="heightArrows" :object="heightArrows" />
    </template>

    <!-- Depth measurement line (Z axis) - shown when editing depth -->
    <template v-if="viewerStore.activeDimensionMeasurement === 'depth' && depthLine">
      <primitive :object="depthLine" />
      <primitive v-if="depthArrows" :object="depthArrows" />
    </template>

    <!-- Base Thickness measurement line (Z axis) - shown when editing baseThickness -->
    <template v-if="viewerStore.activeDimensionMeasurement === 'baseThickness' && baseThicknessLine">
      <primitive :object="baseThicknessLine" />
      <primitive v-if="baseThicknessArrows" :object="baseThicknessArrows" />
    </template>
  </TresGroup>
</template>
<script setup>
import { computed, watch, shallowRef } from "vue";
import * as THREE from "three";
import { useViewerStore } from "../../../../stores/viewer";

const viewerStore = useViewerStore();

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

const widthLine = shallowRef(null);
const heightLine = shallowRef(null);
const widthArrows = shallowRef(null);
const heightArrows = shallowRef(null);
const depthLine = shallowRef(null);
const depthArrows = shallowRef(null);
const baseThicknessLine = shallowRef(null);
const baseThicknessArrows = shallowRef(null);

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

// Update measurement lines based on mesh and active dimension
function updateMeasurements() {
  if (!props.mesh) return;

  const box = new THREE.Box3().setFromObject(props.mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Only create width line when needed
  if (viewerStore.activeDimensionMeasurement === "width") {
    // Width line (along X axis, positioned at Z=0 below mesh, alongside the width)
    // In Blender coordinate system: X = width, Y = depth, Z = height
    const widthZ = 0; // At Z=0 (ground plane)
    const widthY = box.min.y - 10; // In front of mesh + 10mm padding
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

    widthLine.value = createMeasurementLine(widthStart, widthEnd, 0xff0000); // Red for X-axis
    widthArrows.value = createArrowHeads(widthStart, widthEnd, 0xff0000);
  }

  // Only create height line when needed
  if (viewerStore.activeDimensionMeasurement === "height") {
    // Height line (along Y axis, positioned to the right of mesh with padding)
    // In Blender coordinate system: Y represents the depth dimension
    const heightX = box.max.x + 10; // Right of mesh + 10mm padding
    const heightZ = center.z;
    const heightStart = new THREE.Vector3(heightX, box.min.y, heightZ);
    const heightEnd = new THREE.Vector3(heightX, box.max.y, heightZ);

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

    heightLine.value = createMeasurementLine(heightStart, heightEnd, 0x00ff00); // Green for Y-axis
    heightArrows.value = createArrowHeads(heightStart, heightEnd, 0x00ff00);
  }

  // Only create depth line when needed (Z axis - relief height)
  if (viewerStore.activeDimensionMeasurement === "depth") {
    // Depth line (along Z axis, positioned to the side of mesh with padding)
    // Shows the relief height from Z=0 (surface) to top
    const depthX = box.max.x + 10; // Right of mesh + 10mm padding (same as base thickness)
    const depthY = center.y;
    const depthStart = new THREE.Vector3(depthX, depthY, 0); // From Z=0 (surface level)
    const depthEnd = new THREE.Vector3(depthX, depthY, box.max.z); // To top of relief

    if (depthLine.value) {
      depthLine.value.geometry.dispose();
      depthLine.value.material.dispose();
    }
    if (depthArrows.value) {
      depthArrows.value.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    depthLine.value = createMeasurementLine(depthStart, depthEnd, 0x0000ff); // Blue for Z-axis
    depthArrows.value = createArrowHeads(depthStart, depthEnd, 0x0000ff);
  }

  // Only create base thickness line when needed (Z axis - negative)
  if (viewerStore.activeDimensionMeasurement === "baseThickness") {
    // Base thickness line (along Z axis, below Z=0)
    // Shows the base thickness below the relief surface
    const baseX = box.max.x + 10; // Right of mesh + 10mm padding (same as depth)
    const baseY = center.y;
    const baseStart = new THREE.Vector3(baseX, baseY, box.min.z); // From bottom of base
    const baseEnd = new THREE.Vector3(baseX, baseY, 0); // To Z=0 (surface level)

    if (baseThicknessLine.value) {
      baseThicknessLine.value.geometry.dispose();
      baseThicknessLine.value.material.dispose();
    }
    if (baseThicknessArrows.value) {
      baseThicknessArrows.value.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    baseThicknessLine.value = createMeasurementLine(baseStart, baseEnd, 0x0000ff); // Blue for Z-axis (below surface)
    baseThicknessArrows.value = createArrowHeads(baseStart, baseEnd, 0x0000ff);
  }
}

// Watch for mesh changes
watch(() => props.mesh, updateMeasurements, { immediate: true });
watch([() => props.targetWidthMm, () => props.targetHeightMm], updateMeasurements);
// Watch for active dimension changes
watch(() => viewerStore.activeDimensionMeasurement, updateMeasurements);
</script>
