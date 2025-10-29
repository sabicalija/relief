/**
 * Image processing utilities
 * Exports depth processing and image manipulation functions
 */

// Re-export depth processing functions
export {
  adaptiveHistogramEqualization,
  gaussianSmooth,
  enhanceDepthDetails,
  applyContourFlattening,
} from "./depthmap.js";

// Re-export image processing functions
export {
  calculateMeshDimensions,
  calculateTargetResolution,
  resampleImage,
  extractPixelData,
  extractDepthValues,
  loadImage,
} from "./processing.js";
