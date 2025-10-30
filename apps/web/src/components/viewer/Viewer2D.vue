<template>
  <div class="viewer-2d">
    <img v-if="imageStore.depthMap" :src="imageStore.depthMap" alt="Depth map preview" />
  </div>
</template>

<script setup>
import { useImageStore } from "../../stores/image";

const imageStore = useImageStore();
</script>

<style scoped>
.viewer-2d {
  width: 100%;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
}

.viewer-2d img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}
</style>
