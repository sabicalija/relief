<template>
  <div class="app">
    <h1>Relief</h1>
    <Upload />
    <Controls />
    <div class="viewer-container">
      <Preview />
      <Viewer />
    </div>
    <DemoGallery />
  </div>
</template>

<script setup>
import Upload from "./components/Upload.vue";
import Controls from "./components/Controls.vue";
import Preview from "./components/Preview.vue";
import Viewer from "./components/Viewer.vue";
import DemoGallery from "./components/DemoGallery.vue";
</script>

<style scoped>
.app {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.viewer-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: flex-start;
  margin-top: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.viewer-container > * {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1024px) {
  .viewer-container {
    flex-direction: column;
  }

  .viewer-container > * {
    width: 100%;
  }
}
</style>
