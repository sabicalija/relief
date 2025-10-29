import { defineStore } from "pinia";
import { ref } from "vue";

export const useImageStore = defineStore("image", () => {
  const depthMap = ref(null);
  const textureMap = ref(null); // Optional separate texture for mesh
  const useCustomTexture = ref(false); // Switch between depth map and custom texture
  const imageDimensions = ref(null); // Store original image dimensions
  const depthMapFilename = ref(null); // Original filename of the depth map
  const viewMode = ref("3d"); // "2d" for depth map, "3d" for STL viewer

  // Relief config parameters - all in mm for consistency
  const targetDepthMm = ref(20.0);
  const baseThicknessMm = ref(10.0);
  const targetWidthMm = ref(null);
  const targetHeightMm = ref(null);
  const maxResolution = ref(1024); // Maximum resolution for mesh generation
  const simplificationRatio = ref(1.0); // Mesh simplification ratio (0.0-1.0, 1.0 = no simplification)
  const showTexture = ref(true); // Toggle for depth map texture projection
  const showGrid = ref(true); // Toggle for grid helper in viewer
  const baseColor = ref("#808080"); // Color for perimeter walls and bottom surface

  // Advanced depth enhancement options
  const enhanceDetails = ref(false); // Enable adaptive depth enhancement
  const detailEnhancementStrength = ref(1.5); // How much to enhance fine details (1.0 = no enhancement)
  const detailThreshold = ref(0.1); // Threshold for what counts as "close" values (0.0-1.0)
  const preserveMajorFeatures = ref(true); // Keep large depth differences intact
  const smoothingKernelSize = ref(3); // Size of smoothing kernel for noise reduction

  // Contour feature - flatten vertices above threshold
  const enableContour = ref(false); // Enable contour flattening
  const contourThreshold = ref(0.8); // Z threshold (0-1) - vertices above this are flattened

  function setDepthMap(imageData, filename = null) {
    depthMap.value = imageData;
    if (filename) {
      depthMapFilename.value = filename;
    }
  }

  function setTextureMap(imageData) {
    textureMap.value = imageData;
  }

  function clearDepthMap() {
    depthMap.value = null;
    textureMap.value = null;
    imageDimensions.value = null;
    depthMapFilename.value = null;
  }

  function setImageDimensions(dimensions) {
    imageDimensions.value = dimensions;
  }

  function setMaxResolution(value) {
    const parsed = parseInt(value);

    // If no dimensions yet, use safe default
    if (!imageDimensions.value) {
      maxResolution.value = Math.max(1, parsed || 1024);
      return;
    }

    const { width, height } = imageDimensions.value;
    const maxDim = Math.max(width, height);

    // Validate: minimum 1px for the maxResolution, maximum is original max dimension
    // This allows the smaller dimension to scale down below 1px if user wants
    const validated = Math.max(1, Math.min(maxDim, parsed || 1024));
    maxResolution.value = validated;
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

  function setShowTexture(value) {
    showTexture.value = value;
  }

  function setShowGrid(value) {
    showGrid.value = value;
  }

  function setBaseColor(value) {
    baseColor.value = value;
  }

  function setSimplificationRatio(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 0.01 and 1.0
    simplificationRatio.value = Math.max(0.01, Math.min(1.0, parsed || 1.0));
  }

  function setUseCustomTexture(value) {
    useCustomTexture.value = value;
  }

  function setEnhanceDetails(value) {
    enhanceDetails.value = value;
  }

  function setDetailEnhancementStrength(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 1.0 and 5.0
    detailEnhancementStrength.value = Math.max(1.0, Math.min(5.0, parsed || 1.5));
  }

  function setDetailThreshold(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 0.0 and 1.0
    detailThreshold.value = Math.max(0.0, Math.min(1.0, parsed || 0.1));
  }

  function setPreserveMajorFeatures(value) {
    preserveMajorFeatures.value = value;
  }

  function setSmoothingKernelSize(value) {
    const parsed = parseInt(value);
    // Validate: must be odd number between 1 and 15
    let validated = Math.max(1, Math.min(15, parsed || 3));
    // Make it odd
    if (validated % 2 === 0) validated += 1;
    smoothingKernelSize.value = validated;
  }

  function setEnableContour(value) {
    enableContour.value = value;
  }

  function setContourThreshold(value) {
    const parsed = parseFloat(value);
    contourThreshold.value = Math.max(0.0, Math.min(1.0, parsed || 0.8));
  }

  return {
    depthMap,
    textureMap,
    useCustomTexture,
    imageDimensions,
    depthMapFilename,
    targetDepthMm,
    baseThicknessMm,
    targetWidthMm,
    targetHeightMm,
    maxResolution,
    simplificationRatio,
    showTexture,
    showGrid,
    baseColor,
    enhanceDetails,
    detailEnhancementStrength,
    detailThreshold,
    preserveMajorFeatures,
    smoothingKernelSize,
    enableContour,
    contourThreshold,
    viewMode,
    setDepthMap,
    setTextureMap,
    setUseCustomTexture,
    clearDepthMap,
    setImageDimensions,
    setTargetDepthMm,
    setBaseThicknessMm,
    setTargetWidthMm,
    setTargetHeightMm,
    setMaxResolution,
    setSimplificationRatio,
    setShowTexture,
    setShowGrid,
    setBaseColor,
    setEnhanceDetails,
    setDetailEnhancementStrength,
    setDetailThreshold,
    setPreserveMajorFeatures,
    setSmoothingKernelSize,
    setEnableContour,
    setContourThreshold,
    setSmoothingKernelSize,
  };
});
