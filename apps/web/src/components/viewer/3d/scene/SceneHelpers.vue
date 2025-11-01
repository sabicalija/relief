<template>
  <TresGridHelper v-if="showGrid" :args="gridArgs" />
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
