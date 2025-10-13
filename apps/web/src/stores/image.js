import { defineStore } from "pinia";
import { ref } from "vue";

export const useImageStore = defineStore("image", () => {
  const depthMap = ref(null);

  function setDepthMap(imageData) {
    depthMap.value = imageData;
  }

  function clearDepthMap() {
    depthMap.value = null;
  }

  return {
    depthMap,
    setDepthMap,
    clearDepthMap,
  };
});
