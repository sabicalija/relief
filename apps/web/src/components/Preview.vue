<template>
  <div v-if="imageStore.depthMap" class="preview">
    <h2>Depth Map</h2>
    <img :src="imageStore.depthMap" alt="Depth map preview" />
  </div>
</template>

<script setup>
import { useImageStore } from "../stores/image";

const imageStore = useImageStore();
</script>

<style scoped>
.preview {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
  text-align: left;
}

.preview img {
  width: 100%;
  height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}
</style>
