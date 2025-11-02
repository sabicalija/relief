<template>
  <CameraAspectSync v-model:canvas-aspect="canvasAspect" />
</template>

<script setup>
import CameraAspectSync from "../../shared/CameraAspectSync.vue";

const canvasAspect = defineModel("canvasAspect", {
  type: Number,
  default: 1,
});
</script>
