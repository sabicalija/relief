import { defineStore } from "pinia";
import { ref } from "vue";

export const useImageStore = defineStore("image", () => {
  const depthMap = ref(null);

  // Relief config parameters - all in mm for consistency
  const targetDepthMm = ref(100.0); // Default 100mm depth
  const baseThicknessMm = ref(20.0); // Default 20mm base
  const targetWidthMm = ref(null);
  const targetHeightMm = ref(null);

  function setDepthMap(imageData) {
    depthMap.value = imageData;
  }

  function clearDepthMap() {
    depthMap.value = null;
  }

  function setTargetDepthMm(value) {
    // Validate: must be positive, minimum 0.1 mm (no max limit)
    const validated = Math.max(0.1, parseFloat(value));
    targetDepthMm.value = validated;
  }

  function setBaseThicknessMm(value) {
    // Validate: must be non-negative (0 or greater, no max limit)
    const validated = Math.max(0.0, parseFloat(value));
    baseThicknessMm.value = validated;
  }

  function setTargetWidthMm(value) {
    // Validate: must be null or positive number >= 1
    if (value === null || value === "") {
      targetWidthMm.value = null;
    } else {
      const validated = Math.max(1, parseFloat(value));
      targetWidthMm.value = validated;
    }
  }

  function setTargetHeightMm(value) {
    // Validate: must be null or positive number >= 1
    if (value === null || value === "") {
      targetHeightMm.value = null;
    } else {
      const validated = Math.max(1, parseFloat(value));
      targetHeightMm.value = validated;
    }
  }

  return {
    depthMap,
    targetDepthMm,
    baseThicknessMm,
    targetWidthMm,
    targetHeightMm,
    setDepthMap,
    clearDepthMap,
    setTargetDepthMm,
    setBaseThicknessMm,
    setTargetWidthMm,
    setTargetHeightMm,
  };
});
