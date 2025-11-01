<template>
  <div class="app">
    <AppHeader />
    <div class="viewer-wrapper">
      <Viewer />
    </div>
    <AppGallery />
  </div>
</template>

<script setup>
import AppHeader from "./components/AppHeader.vue";
import AppGallery from "./components/AppGallery.vue";
import Viewer from "./components/viewer/Viewer.vue";
</script>

<style scoped>
.app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.viewer-wrapper {
  width: 100%;
  height: 100%;
}
</style>
