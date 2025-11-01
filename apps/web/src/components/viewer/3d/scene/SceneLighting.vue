<template>
  <TresAmbientLight :intensity="ambientIntensity" />
  <TresDirectionalLight :position="directionalPosition" :intensity="directionalIntensity" />
</template>

<script setup>
defineProps({
  ambientIntensity: {
    type: Number,
    default: 1.5,
  },
  directionalPosition: {
    type: Array,
    default: () => [1, 1, 1],
  },
  directionalIntensity: {
    type: Number,
    default: 1,
  },
});
</script>
