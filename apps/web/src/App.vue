<template>
  <div class="app">
    <h1>Relief</h1>
    <Upload />
    <Preview />
  </div>
</template>

<script setup>
import Upload from "./components/Upload.vue";
import Preview from "./components/Preview.vue";
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
