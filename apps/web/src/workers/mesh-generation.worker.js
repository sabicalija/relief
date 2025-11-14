/**
 * Web Worker for 3D Mesh Generation
 * Handles compute-intensive mesh generation off the main thread
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
} from "../utils/image/index.js";
import { buildMeshGeometry } from "../utils/mesh/geometry.js";
import { simplifyGeometry } from "../utils/mesh/simplify.js";

/**
 * Decode image data URL to ImageBitmap (worker-compatible)
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<ImageBitmap>}
 */
async function decodeImage(dataUrl) {
  // Extract base64 data and convert to blob
  const base64 = dataUrl.split(",")[1];
  const mimeType = dataUrl.match(/data:([^;]+);/)[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  // Use createImageBitmap (available in workers)
  return await createImageBitmap(blob);
}

/**
 * Generate mesh from depth map (runs in worker)
 * @param {string} imageDataUrl - Base64 data URL of depth map
 * @param {Object} config - Mesh configuration
 * @returns {Object} Serializable mesh data
 */
async function generateMeshInWorker(imageDataUrl, config) {
  const {
    targetDepthMm = 20.0,
    baseThicknessMm = 10.0,
    targetWidthMm = null,
    targetHeightMm = null,
    maxResolution = 1024,
    geometrySimplification = 1.0,
  } = config;

  // Decode the image (worker-compatible)
  const imageBitmap = await decodeImage(imageDataUrl);

  // Calculate target resolution for resampling
  const { width, height } = calculateTargetResolution(imageBitmap.width, imageBitmap.height, maxResolution);

  // Calculate mesh dimensions based on aspect ratio and target dimensions
  const aspectRatio = width / height;
  const { meshWidth, meshHeight } = calculateMeshDimensions(aspectRatio, targetWidthMm, targetHeightMm);

  // Resample image to target resolution and extract pixel data
  // Note: resampleImage expects HTMLImageElement but we need to adapt it for ImageBitmap
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

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
    flattenAboveThreshold: config.flattenAboveThreshold,
    flattenBelowThreshold: config.flattenBelowThreshold,
  });

  // Build 3D mesh geometry from processed depth map
  const { geometry, segmentsX, segmentsY } = buildMeshGeometry(finalDepth, width, height, {
    meshWidth,
    meshHeight,
    targetDepthMm,
    baseThicknessMm,
  });

  // Notify main thread about simplification start
  if (geometrySimplification < 0.99) {
    self.postMessage({
      type: "simplification-start",
      data: {
        originalVertices: geometry.attributes.position.count,
        targetRatio: geometrySimplification,
      },
    });
  }

  // Apply geometry simplification if enabled
  // Note: Can't pass statusStore to worker, so we handle status via messages
  const finalGeometry = await simplifyGeometry(geometry, geometrySimplification, null);

  // Notify main thread about simplification complete
  if (geometrySimplification < 0.99) {
    self.postMessage({
      type: "simplification-complete",
      data: {
        finalVertices: finalGeometry.attributes.position.count,
      },
    });
  }

  // Check if simplification removed UVs
  const hasUVs = finalGeometry.attributes.uv !== undefined;
  const wasSimplified = geometrySimplification < 0.99;

  // Serialize geometry data for transfer to main thread
  // Use toJSON() to get structured data that can be cloned
  const geometryData = finalGeometry.toJSON();

  return {
    geometryData,
    metadata: {
      resolution: {
        width: segmentsX + 1,
        height: segmentsY + 1,
        total: (segmentsX + 1) * (segmentsY + 1),
      },
      hasUVs,
      wasSimplified,
      showTexture: hasUVs && config.showTexture,
      imageDataUrl, // Pass through for material creation
      itemColor: config.itemColor,
      textureMap: hasUVs ? config.textureMap : null,
    },
  };
}

// Worker message handler
self.onmessage = async (event) => {
  const { type, data } = event.data;

  try {
    if (type === "generate") {
      const { imageDataUrl, config } = data;
      const result = await generateMeshInWorker(imageDataUrl, config);

      self.postMessage({
        type: "success",
        data: result,
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
};
