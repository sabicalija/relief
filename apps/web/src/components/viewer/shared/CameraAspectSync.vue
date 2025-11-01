<template>
  <!-- This component has no visual template - it only syncs aspect ratio -->
</template>

<script setup>
import { watch, onMounted } from "vue";
import { useTresContext } from "@tresjs/core";

const canvasAspect = defineModel("canvasAspect", {
  type: Number,
  default: 1,
});

const context = useTresContext();

// Function to update aspect ratio
const updateAspect = () => {
  const sizes = context.sizes.value;
  if (sizes && sizes.width && sizes.height) {
    const newAspect = sizes.width / sizes.height;
    canvasAspect.value = newAspect;
  } else {
    // Fallback: try to get from renderer
    const renderer = context.renderer?.instance;
    if (renderer && renderer.domElement) {
      const width = renderer.domElement.clientWidth;
      const height = renderer.domElement.clientHeight;
      if (width && height) {
        const newAspect = width / height;
        canvasAspect.value = newAspect;
      }
    }
  }
};

// Watch for canvas size changes
watch(
  () => context.sizes.value,
  () => {
    updateAspect();
  },
  { immediate: true, deep: true }
);

// Also watch renderer
watch(
  () => context.renderer?.instance,
  () => {
    updateAspect();
  },
  { immediate: true }
);

onMounted(() => {
  // Try immediately
  updateAspect();

  // Retry after a short delay if not successful
  setTimeout(() => {
    if (canvasAspect.value === 1) {
      updateAspect();
    }
  }, 100);
});
</script>
