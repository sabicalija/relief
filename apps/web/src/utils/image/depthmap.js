/**
 * Depth map processing functions
 * Handles enhancement, smoothing, and contour operations on depth maps
 */

/**
 * Apply adaptive histogram equalization to enhance depth details
 * @param {Float32Array} depthMap - 2D depth map as 1D array
 * @param {number} width - Width of the depth map
 * @param {number} height - Height of the depth map
 * @param {number} strength - Enhancement strength (0.0 = no enhancement, 1.0 = full equalization, >1.0 = over-enhancement)
 * @returns {Float32Array} Enhanced depth map
 */
export function adaptiveHistogramEqualization(depthMap, width, height, strength) {
  // Create histogram of depth values (256 bins)
  const bins = 256;
  const hist = new Array(bins).fill(0);

  // Build histogram
  for (let i = 0; i < depthMap.length; i++) {
    const binIdx = Math.min(bins - 1, Math.floor(depthMap[i] * (bins - 1)));
    hist[binIdx]++;
  }

  // Calculate cumulative distribution function (CDF)
  const cdf = new Array(bins);
  cdf[0] = hist[0];
  for (let i = 1; i < bins; i++) {
    cdf[i] = cdf[i - 1] + hist[i];
  }

  // Normalize CDF to [0, 1]
  const totalPixels = cdf[bins - 1];
  for (let i = 0; i < bins; i++) {
    cdf[i] = cdf[i] / totalPixels;
  }

  // Apply strength control
  if (strength !== 1.0) {
    for (let i = 0; i < bins; i++) {
      const linear = i / (bins - 1);
      cdf[i] = linear + strength * (cdf[i] - linear);
      cdf[i] = Math.max(0, Math.min(1, cdf[i])); // Clip to [0, 1]
    }
  }

  // Apply transformation to depth map
  const enhanced = new Float32Array(depthMap.length);
  for (let i = 0; i < depthMap.length; i++) {
    const binIdx = Math.min(bins - 1, Math.floor(depthMap[i] * (bins - 1)));
    enhanced[i] = cdf[binIdx];
  }

  return enhanced;
}

/**
 * Apply Gaussian blur for smoothing
 * @param {Float32Array} depthMap - 2D depth map as 1D array
 * @param {number} width - Width of the depth map
 * @param {number} height - Height of the depth map
 * @param {number} kernelSize - Size of the Gaussian kernel (odd number)
 * @returns {Float32Array} Smoothed depth map
 */
export function gaussianSmooth(depthMap, width, height, kernelSize) {
  if (kernelSize <= 1) return depthMap;

  const sigma = kernelSize / 3.0;
  const radius = Math.floor(kernelSize / 2);

  // Create Gaussian kernel
  const kernel = [];
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  const smoothed = new Float32Array(depthMap.length);

  // Apply separable Gaussian filter (horizontal then vertical)
  const temp = new Float32Array(depthMap.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = -radius; k <= radius; k++) {
        const xk = Math.max(0, Math.min(width - 1, x + k));
        value += depthMap[y * width + xk] * kernel[k + radius];
      }
      temp[y * width + x] = value;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = -radius; k <= radius; k++) {
        const yk = Math.max(0, Math.min(height - 1, y + k));
        value += temp[yk * width + x] * kernel[k + radius];
      }
      smoothed[y * width + x] = value;
    }
  }

  return smoothed;
}

/**
 * Apply contour flattening to depth map
 * @param {Float32Array} depthMap - Input depth map
 * @param {Object} contourConfig - Contour configuration
 * @returns {Float32Array} Flattened depth map (or original if disabled)
 */
export function applyContourFlattening(depthMap, contourConfig) {
  const {
    enableContour = false,
    contourThreshold,
    flattenAboveThreshold = true,
    flattenBelowThreshold = false,
  } = contourConfig;

  if (!enableContour || contourThreshold === undefined) {
    return depthMap;
  }

  // At least one must be enabled
  if (!flattenAboveThreshold && !flattenBelowThreshold) {
    console.warn("⚠️ Neither flattenAboveThreshold nor flattenBelowThreshold enabled, using default (above)");
    return applyContourFlattening(depthMap, {
      ...contourConfig,
      flattenAboveThreshold: true,
      flattenBelowThreshold: false,
    });
  }

  const flattened = new Float32Array(depthMap.length);

  for (let i = 0; i < depthMap.length; i++) {
    let value = depthMap[i];

    // Apply flattening based on enabled modes
    if (flattenAboveThreshold && value >= contourThreshold) {
      value = 1.0; // Flatten to max
    }
    if (flattenBelowThreshold && value < contourThreshold) {
      value = 0.0; // Flatten to min
    }

    flattened[i] = value;
  }

  // Log the active modes
  const modes = [];
  if (flattenAboveThreshold) modes.push("above → max");
  if (flattenBelowThreshold) modes.push("below → min");
  const modeStr = modes.join(" + ");

  console.log(`🔪 Contour flattening applied at ${(contourThreshold * 100).toFixed(0)}% threshold (${modeStr})`);

  return flattened;
}

/**
 * Enhance depth details using adaptive histogram equalization
 * @param {Float32Array} depthMap - 2D depth map as 1D array
 * @param {number} width - Width of the depth map
 * @param {number} height - Height of the depth map
 * @param {Object} enhanceConfig - Enhancement configuration
 * @returns {Float32Array} Enhanced depth map
 */
export function enhanceDepthDetails(depthMap, width, height, enhanceConfig) {
  const {
    enhanceDetails = false,
    detailEnhancementStrength = 1.0,
    detailThreshold = 0.1,
    preserveMajorFeatures = true,
    smoothingKernelSize = 3,
  } = enhanceConfig;

  if (!enhanceDetails) {
    return depthMap;
  }

  console.log(`🔍 Enhancing depth details (strength: ${detailEnhancementStrength.toFixed(2)})...`);

  let enhanced = new Float32Array(depthMap);

  // Apply smoothing if requested
  if (smoothingKernelSize > 1) {
    enhanced = gaussianSmooth(enhanced, width, height, smoothingKernelSize);
  }

  if (preserveMajorFeatures) {
    // Calculate gradients to identify fine vs major features
    const gradients = new Float32Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const gradX = enhanced[idx + 1] - enhanced[idx - 1];
        const gradY = enhanced[idx + width] - enhanced[idx - width];
        gradients[idx] = Math.sqrt(gradX * gradX + gradY * gradY);
      }
    }

    // Create masks for detail and major feature regions
    const detailMask = new Float32Array(width * height);
    const majorMask = new Float32Array(width * height);

    for (let i = 0; i < gradients.length; i++) {
      detailMask[i] = gradients[i] < detailThreshold ? 1 : 0;
      majorMask[i] = 1 - detailMask[i];
    }

    // Extract detail regions
    const detailRegions = new Float32Array(width * height);
    for (let i = 0; i < enhanced.length; i++) {
      detailRegions[i] = enhanced[i] * detailMask[i];
    }

    // Check if there are any details to enhance
    let minDetail = Infinity;
    let maxDetail = -Infinity;
    for (let i = 0; i < detailRegions.length; i++) {
      if (detailMask[i] > 0) {
        minDetail = Math.min(minDetail, detailRegions[i]);
        maxDetail = Math.max(maxDetail, detailRegions[i]);
      }
    }

    if (maxDetail > minDetail) {
      // Enhance detail regions
      const detailEnhanced = adaptiveHistogramEqualization(detailRegions, width, height, detailEnhancementStrength);

      // Combine: major features unchanged + enhanced details
      for (let i = 0; i < enhanced.length; i++) {
        enhanced[i] = enhanced[i] * majorMask[i] + detailEnhanced[i] * detailMask[i];
      }
    }
  } else {
    // Global enhancement
    enhanced = adaptiveHistogramEqualization(enhanced, width, height, detailEnhancementStrength);
  }

  // Normalize to [0, 1] range
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < enhanced.length; i++) {
    min = Math.min(min, enhanced[i]);
    max = Math.max(max, enhanced[i]);
  }

  if (max > min) {
    for (let i = 0; i < enhanced.length; i++) {
      enhanced[i] = (enhanced[i] - min) / (max - min);
    }
  }

  console.log(`✓ Depth enhancement complete`);

  return enhanced;
}
