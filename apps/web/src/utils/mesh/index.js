/**
 * 3D Mesh utilities - Main entry point
 * Orchestrates depth map to 3D mesh conversion
 */
import * as THREE from "three";
import {
  adaptiveHistogramEqualization,
  gaussianSmooth,
  enhanceDepthDetails,
  applyContourFlattening,
  calculateMeshDimensions,
  calculateTargetResolution,
  resampleImage,
  extractPixelData,
  extractDepthValues,
  loadImage,
} from "../image/index.js";
import { buildMeshGeometry } from "./geometry.js";
import { createMeshMaterials } from "./material.js";
import { exportToSTL, download } from "./stl.js";

// Re-export all public functions
export {
  // Depth processing
  adaptiveHistogramEqualization,
  gaussianSmooth,
  enhanceDepthDetails,
  applyContourFlattening,
  // Image processing
  calculateMeshDimensions,
  calculateTargetResolution,
  resampleImage,
  extractPixelData,
  extractDepthValues,
  // STL export
  exportToSTL,
  download,
};

/**
 * Convert a depth map image to a 3D mesh
 * @param {string} imageDataUrl - Base64 data URL of the depth map image
 * @param {Object} config - Configuration parameters
 * @returns {Promise<THREE.Mesh>}
 */
export async function createMeshFromDepthMap(imageDataUrl, config) {
  const {
    targetDepthMm = 20.0,
    baseThicknessMm = 10.0,
    targetWidthMm = null,
    targetHeightMm = null,
    maxResolution = 1024, // Reasonable default that balances quality and performance
  } = config;

  // Load the depth map image
  const image = await loadImage(imageDataUrl);

  // Calculate target resolution for resampling
  const { width, height } = calculateTargetResolution(image.width, image.height, maxResolution);

  // Calculate mesh dimensions based on aspect ratio and target dimensions
  const aspectRatio = width / height;
  const { meshWidth, meshHeight } = calculateMeshDimensions(aspectRatio, targetWidthMm, targetHeightMm);

  // Resample image to target resolution and extract pixel data
  const canvas = resampleImage(image, width, height);
  const pixels = extractPixelData(canvas);

  // Extract depth values from grayscale image into a Float32Array
  const depthValues = extractDepthValues(pixels, width, height);

  // Apply depth enhancement if enabled
  const enhancedDepth = enhanceDepthDetails(depthValues, width, height, {
    enhanceDetails: config.enhanceDetails || false,
    detailEnhancementStrength: config.detailEnhancementStrength || 1.5,
    detailThreshold: config.detailThreshold || 0.1,
    preserveMajorFeatures: config.preserveMajorFeatures !== false,
    smoothingKernelSize: config.smoothingKernelSize || 3,
  });

  // Apply contour flattening if enabled
  const finalDepth = applyContourFlattening(enhancedDepth, {
    enableContour: config.enableContour,
    contourThreshold: config.contourThreshold,
  });

  // Build 3D mesh geometry from processed depth map
  const { geometry, segmentsX, segmentsY } = buildMeshGeometry(finalDepth, width, height, {
    meshWidth,
    meshHeight,
    targetDepthMm,
    baseThicknessMm,
  });

  // Create materials for the mesh
  const materials = createMeshMaterials({
    showTexture: config.showTexture,
    textureMap: config.textureMap,
    imageDataUrl,
    baseColor: config.baseColor,
  });

  const mesh = new THREE.Mesh(geometry, materials);

  // Store mesh resolution as user data for display
  mesh.userData.resolution = {
    width: segmentsX + 1,
    height: segmentsY + 1,
    total: (segmentsX + 1) * (segmentsY + 1),
  };

  // Rotate to align with 2D plane (180° around X, 180° around Y)
  mesh.rotation.x = Math.PI / 2;
  mesh.rotation.y = Math.PI;

  return mesh;
}
