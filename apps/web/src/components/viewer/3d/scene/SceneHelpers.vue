<template>
  <!-- Grid on XY plane (rotated 90° around X to lay flat on ground in Z-up system) -->
  <TresGridHelper v-if="showGrid" :args="gridArgs" :rotation="[-Math.PI / 2, 0, 0]" />
  <TresAxesHelper v-if="showAxes" :args="axesArgs" />
</template>

<script setup>
defineProps({
  showGrid: {
    type: Boolean,
    default: true,
  },
  gridArgs: {
    type: Array,
    default: () => [200, 20],
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
</script>
