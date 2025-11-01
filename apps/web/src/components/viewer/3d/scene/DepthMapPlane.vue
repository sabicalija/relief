<template>
  <TresGroup v-if="depthMapTexture">
    <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, Math.PI, 0]">
      <TresPlaneGeometry :args="[planeWidth, planeHeight]" />
      <TresMeshBasicMaterial :map="depthMapTexture" :side="2" />
    </TresMesh>
  </TresGroup>
</template>

<script setup>
import { computed, watch, shallowRef, markRaw } from "vue";
import * as THREE from "three";
import { useImageStore } from "../../../../stores/image";
import { calculateMeshDimensions } from "../../../../utils/image/processing";

const imageStore = useImageStore();

const depthMapTexture = shallowRef(null);

// Calculate plane dimensions using same logic as 3D mesh
const planeWidth = computed(() => {
  if (!imageStore.imageDimensions) return 100;

  const aspectRatio = imageStore.imageDimensions.width / imageStore.imageDimensions.height;
  const { meshWidth } = calculateMeshDimensions(aspectRatio, imageStore.targetWidthMm, imageStore.targetHeightMm);

  return meshWidth;
});

const planeHeight = computed(() => {
  if (!imageStore.imageDimensions) return 100;

  const aspectRatio = imageStore.imageDimensions.width / imageStore.imageDimensions.height;
  const { meshHeight } = calculateMeshDimensions(aspectRatio, imageStore.targetWidthMm, imageStore.targetHeightMm);

  return meshHeight;
});

// Load texture when depth map changes
watch(
  () => imageStore.depthMap,
  (newDepthMap) => {
    if (!newDepthMap) {
      depthMapTexture.value = null;
      return;
    }

    // Dispose old texture
    if (depthMapTexture.value) {
      depthMapTexture.value.dispose();
    }

    // Create new texture from depth map
    const loader = new THREE.TextureLoader();
    loader.load(
      newDepthMap,
      (texture) => {
        // Configure texture
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        depthMapTexture.value = markRaw(texture);
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error);
      }
    );
  },
  { immediate: true }
);
</script>
