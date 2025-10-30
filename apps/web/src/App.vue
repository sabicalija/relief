<template>
  <div class="app">
    <h1>Relief</h1>
    <p class="subtitle">
      Schauen tut man mit den <span class="strikethrough">Augen</span> <span class="replacement">Händen</span>.
    </p>
    <p class="attribution">Austrian Proverb</p>
    <Upload />
    <Controls />
    <div class="viewer-wrapper">
      <Viewer />
    </div>
    <DemoGallery />
  </div>
</template>

<script setup>
import Upload from "./components/Upload.vue";
import Controls from "./components/Controls.vue";
import Viewer from "./components/viewer/Viewer.vue";
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
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.25rem;
  color: #6c757d;
  font-style: italic;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.attribution {
  font-size: 0.875rem;
  color: #adb5bd;
  margin-top: 0;
  margin-bottom: 2rem;
}

.strikethrough {
  text-decoration: line-through;
  color: #adb5bd;
}

.replacement {
  color: #42b983;
  font-weight: 600;
}

.viewer-wrapper {
  margin-top: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}
</style>
