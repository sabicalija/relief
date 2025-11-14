import { ref } from "vue";

/**
 * Create all reactive state for the image store
 * @returns {Object} All state refs
 */
export function createImageState() {
  // Image data
  const depthMap = ref(null);
  const textureMap = ref(null); // Optional separate texture for mesh
  const imageDimensions = ref(null); // Store original image dimensions
  const depthMapFilename = ref(null); // Original filename of the depth map
  const depthMapFileSize = ref(null); // File size in bytes
  const viewMode = ref("3d"); // "2d" for depth map, "3d" for STL viewer

  // Depth generation config
  const depthModelVariant = ref(null); // Selected model variant (e.g., "q8", "fp16", "fp32")
  const depthExecutionBackend = ref(null); // Selected execution backend (e.g., "wasm", "webgpu")
  // Legacy: kept for backward compatibility during migration
  const depthModelConfig = ref(null); // Selected model config key (e.g., "q8_wasm", "fp16_webgpu")

  // Relief config parameters - all in mm for consistency
  const targetDepthMm = ref(20.0);
  const baseThicknessMm = ref(10.0);
  const targetWidthMm = ref(null);
  const targetHeightMm = ref(null);
  const maxResolution = ref(1024); // Maximum resolution for mesh generation
  const simplificationRatio = ref(1.0); // Mesh simplification ratio (0.0-1.0, 1.0 = no simplification)
  const geometrySimplification = ref(1.0); // Post-processing geometry simplification (0.0-1.0, 1.0 = no simplification)

  // Display options
  const showTexture = ref(false); // Toggle for texture projection (only shows when custom texture loaded)
  const showGrid = ref(true); // Toggle for grid helper in viewer
  const itemColor = ref("#808080"); // Color for the entire mesh

  // Advanced depth enhancement options
  const enhanceDetails = ref(false); // Enable adaptive depth enhancement
  const detailEnhancementStrength = ref(1.0); // Enhancement strength (0.0 = none, 1.0 = full equalization, >1.0 = over-enhancement)
  const detailThreshold = ref(0.1); // Threshold for what counts as "close" values (0.0-1.0)
  const preserveMajorFeatures = ref(true); // Keep large depth differences intact
  const smoothingKernelSize = ref(3); // Size of smoothing kernel for noise reduction

  // Contour feature - flatten vertices above/below threshold
  const enableContour = ref(false); // Enable contour flattening
  const contourThreshold = ref(0.8); // Z threshold (0-1)
  const flattenAboveThreshold = ref(true); // Flatten vertices above threshold to max (default)
  const flattenBelowThreshold = ref(true); // Flatten vertices below threshold to 0 (default)

  return {
    // Image data
    depthMap,
    textureMap,
    imageDimensions,
    depthMapFilename,
    depthMapFileSize,
    viewMode,
    // Mesh config
    targetDepthMm,
    baseThicknessMm,
    targetWidthMm,
    targetHeightMm,
    maxResolution,
    simplificationRatio,
    geometrySimplification,
    // Display
    showTexture,
    showGrid,
    itemColor,
    // Depth generation
    depthModelVariant,
    depthExecutionBackend,
    depthModelConfig, // Legacy
    // Enhancements
    enhanceDetails,
    detailEnhancementStrength,
    detailThreshold,
    preserveMajorFeatures,
    smoothingKernelSize,
    // Contour
    enableContour,
    contourThreshold,
    flattenAboveThreshold,
    flattenBelowThreshold,
  };
}
