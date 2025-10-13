<template>
  <div class="app">
    <h1>Relief</h1>
    <Upload />
    <Controls />
    <Viewer />
    <Preview />
  </div>
</template>

<script setup>
import Upload from "./components/Upload.vue";
import Controls from "./components/Controls.vue";
import Preview from "./components/Preview.vue";
import Viewer from "./components/Viewer.vue";
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
</style>
