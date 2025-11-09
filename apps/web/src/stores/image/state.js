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
  const viewMode = ref("3d"); // "2d" for depth map, "3d" for STL viewer

  // Relief config parameters - all in mm for consistency
  const targetDepthMm = ref(20.0);
  const baseThicknessMm = ref(10.0);
  const targetWidthMm = ref(null);
  const targetHeightMm = ref(null);
  const maxResolution = ref(1024); // Maximum resolution for mesh generation
  const simplificationRatio = ref(1.0); // Mesh simplification ratio (0.0-1.0, 1.0 = no simplification)

  // Display options
  const showTexture = ref(false); // Toggle for texture projection (only shows when custom texture loaded)
  const showGrid = ref(true); // Toggle for grid helper in viewer
  const itemColor = ref("#808080"); // Color for the entire mesh

  // Advanced depth enhancement options
  const enhanceDetails = ref(false); // Enable adaptive depth enhancement
  const detailEnhancementStrength = ref(1.5); // How much to enhance fine details (1.0 = no enhancement)
  const detailThreshold = ref(0.1); // Threshold for what counts as "close" values (0.0-1.0)
  const preserveMajorFeatures = ref(true); // Keep large depth differences intact
  const smoothingKernelSize = ref(3); // Size of smoothing kernel for noise reduction

  // Contour feature - flatten vertices above threshold
  const enableContour = ref(false); // Enable contour flattening
  const contourThreshold = ref(0.8); // Z threshold (0-1) - vertices above this are flattened

  return {
    // Image data
    depthMap,
    textureMap,
    imageDimensions,
    depthMapFilename,
    viewMode,
    // Mesh config
    targetDepthMm,
    baseThicknessMm,
    targetWidthMm,
    targetHeightMm,
    maxResolution,
    simplificationRatio,
    // Display
    showTexture,
    showGrid,
    itemColor,
    // Enhancements
    enhanceDetails,
    detailEnhancementStrength,
    detailThreshold,
    preserveMajorFeatures,
    smoothingKernelSize,
    // Contour
    enableContour,
    contourThreshold,
  };
}
