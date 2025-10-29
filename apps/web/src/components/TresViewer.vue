<template>
  <div class="tres-viewer">
    <TresCanvas v-bind="canvasProps">
      <!-- Camera -->
      <TresPerspectiveCamera :position="[0, 100, 200]" :fov="45" :near="0.1" :far="10000" />

      <!-- Lights -->
      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight :position="[1, 1, 1]" :intensity="1" />
    </TresCanvas>
  </div>
</template>

<script setup>
import { TresCanvas } from "@tresjs/core";
import { reactive } from "vue";

// Canvas configuration
const canvasProps = reactive({
  clearColor: "#f0f0f0",
  antialias: true,
  alpha: false,
});
</script>

<style scoped>
.tres-viewer {
  width: 100%;
  height: 100%;
  min-height: 600px;
  position: relative;
}
</style>
