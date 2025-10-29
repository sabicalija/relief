/**
 * Image processing utilities
 * Handles image resampling, pixel extraction, and dimension calculations
 */

/**
 * Calculate mesh dimensions based on aspect ratio and target dimensions
 * @param {number} aspectRatio - Width/height ratio
 * @param {number|null} targetWidthMm - Desired width in mm
 * @param {number|null} targetHeightMm - Desired height in mm
 * @returns {Object} { meshWidth, meshHeight } in mm
 */
export function calculateMeshDimensions(aspectRatio, targetWidthMm, targetHeightMm) {
  let meshWidth, meshHeight;

  console.log(`📏 Dimension inputs: targetWidthMm=${targetWidthMm}, targetHeightMm=${targetHeightMm}`);

  if (targetWidthMm && targetHeightMm) {
    meshWidth = targetWidthMm;
    meshHeight = targetHeightMm;
    console.log(`✓ Using both width and height: ${meshWidth}×${meshHeight} mm`);
  } else if (targetWidthMm) {
    meshWidth = targetWidthMm;
    meshHeight = targetWidthMm / aspectRatio;
    console.log(`✓ Using width, calculating height: ${meshWidth}×${meshHeight} mm (aspect: ${aspectRatio.toFixed(2)})`);
  } else if (targetHeightMm) {
    meshHeight = targetHeightMm;
    meshWidth = targetHeightMm * aspectRatio;
    console.log(`✓ Using height, calculating width: ${meshWidth}×${meshHeight} mm (aspect: ${aspectRatio.toFixed(2)})`);
  } else {
    meshWidth = 100;
    meshHeight = 100 / aspectRatio;
    console.log(`✓ Using defaults: ${meshWidth}×${meshHeight} mm (aspect: ${aspectRatio.toFixed(2)})`);
  }

  return { meshWidth, meshHeight };
}

/**
 * Calculate target resolution for image resampling
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {number|null} maxResolution - Maximum resolution limit
 * @returns {Object} { width, height, originalWidth, originalHeight }
 */
export function calculateTargetResolution(width, height, maxResolution) {
  const originalWidth = width;
  const originalHeight = height;

  // Downsample to maxResolution to avoid memory issues
  // A 3024×4032 image = 12M vertices = stack overflow!
  // 1024×1024 = 1M vertices = reasonable and detailed
  if (maxResolution && (width > maxResolution || height > maxResolution)) {
    const scale = maxResolution / Math.max(width, height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
    console.log(`📉 Resampling: ${originalWidth}×${originalHeight} → ${width}×${height} pixels (for performance)`);
  } else {
    console.log(`📐 Using full resolution: ${width}×${height} pixels`);
  }

  return { width, height, originalWidth, originalHeight };
}

/**
 * Resample image to target dimensions using canvas
 * @param {HTMLImageElement} image - Source image
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {HTMLCanvasElement} Canvas with resampled image
 */
export function resampleImage(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

/**
 * Extract pixel data from canvas
 * @param {HTMLCanvasElement} canvas - Source canvas
 * @returns {Uint8ClampedArray} RGBA pixel data
 */
export function extractPixelData(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return imageData.data;
}

/**
 * Extract depth values from grayscale depth map
 * Assumes input is a grayscale image where:
 * - Black (0) = far/low depth
 * - White (255) = near/high depth
 * @param {Uint8ClampedArray} pixels - RGBA pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Float32Array} Depth values normalized to (0-1)
 */
export function extractDepthValues(pixels, width, height) {
  const depthValues = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = pixels[pixelIndex];
      // For grayscale images, R = G = B, so we just use the red channel
      // Normalize to 0-1 range
      depthValues[y * width + x] = r / 255.0;
    }
  }

  return depthValues;
}

/**
 * Load an image from a data URL
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
