<template>
  <GizmoSetup />
  <CameraAspectSync v-model:canvas-aspect="canvasAspect" />
</template>

<script setup>
import GizmoSetup from "../../shared/GizmoSetup.vue";
import CameraAspectSync from "../../shared/CameraAspectSync.vue";

const canvasAspect = defineModel("canvasAspect", {
  type: Number,
  default: 1,
});
</script>
