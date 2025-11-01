<template>
  <template v-if="mesh">
    <!-- Mesh object -->
    <primitive :object="mesh" />

    <!-- Transform controls for mesh manipulation -->
    <TransformControls v-if="transformMode" :object="mesh" :mode="transformMode" />

    <!-- Measurement indicators -->
    <MeshMeasurements :mesh="mesh" :target-width-mm="targetWidthMm" :target-height-mm="targetHeightMm" />
  </template>
</template>

<script setup>
import { TransformControls } from "@tresjs/cientos";
import MeshMeasurements from "../mesh/MeshMeasurements.vue";

defineProps({
  mesh: {
    type: Object,
    default: null,
  },
  transformMode: {
    type: String,
    default: null,
  },
  targetWidthMm: {
    type: Number,
    default: null,
  },
  targetHeightMm: {
    type: Number,
    default: null,
  },
});
</script>
