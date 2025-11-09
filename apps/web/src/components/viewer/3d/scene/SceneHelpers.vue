<template>
  <!-- Grid on XY plane (rotated 90° around X to lay flat on ground in Z-up system) -->
  <TresGridHelper v-if="viewerStore.showGrid" :args="[gridSize, gridDivisions]" :rotation="[-Math.PI / 2, 0, 0]" />
  <TresAxesHelper v-if="showAxes" :args="axesArgs" />
</template>

<script setup>
import { toRef } from "vue";
import { useViewerStore } from "../../../../stores/viewer";
import { useImageStore } from "../../../../stores/image";
import { useGridSize, useGridDivisions } from "../../../../composables/useGridSize";

const viewerStore = useViewerStore();
const imageStore = useImageStore();

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
  showAxes: {
    type: Boolean,
    default: false,
  },
  axesArgs: {
    type: Array,
    default: () => [50],
  },
});

// Use composable for grid calculations
const gridSize = useGridSize({
  mesh: toRef(props, "mesh"),
  imageStore,
  manualSize: toRef(viewerStore, "gridSize"),
});

const gridDivisions = useGridDivisions(gridSize, toRef(viewerStore, "gridDivisions"));
</script>
