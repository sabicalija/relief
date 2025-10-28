import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

/**
 * Apply adaptive histogram equalization to enhance depth details
 * @param {Float32Array} depthMap - 2D depth map as 1D array
 * @param {number} width - Width of the depth map
 * @param {number} height - Height of the depth map
 * @param {number} strength - Enhancement strength (1.0 = full equalization)
 * @returns {Float32Array} Enhanced depth map
 */
function adaptiveHistogramEqualization(depthMap, width, height, strength) {
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
function gaussianSmooth(depthMap, width, height, kernelSize) {
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
function applyContourFlattening(depthMap, contourConfig) {
  const { enableContour = false, contourThreshold } = contourConfig;

  if (!enableContour || contourThreshold === undefined) {
    return depthMap;
  }

  const flattened = new Float32Array(depthMap.length);

  for (let i = 0; i < depthMap.length; i++) {
    if (depthMap[i] >= contourThreshold) {
      // Flatten to maximum (1.0)
      flattened[i] = 1.0;
    } else {
      // Keep original value
      flattened[i] = depthMap[i];
    }
  }

  console.log(`🔪 Contour flattening applied at ${(contourThreshold * 100).toFixed(0)}% threshold`);

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
function enhanceDepthDetails(depthMap, width, height, enhanceConfig) {
  const {
    enhanceDetails = false,
    detailEnhancementStrength = 1.5,
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
      if (gradients[i] < detailThreshold) {
        detailMask[i] = 1;
        majorMask[i] = 0;
      } else {
        detailMask[i] = 0;
        majorMask[i] = 1;
      }
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

/**
 * Calculate mesh dimensions based on aspect ratio and target dimensions
 * @param {number} aspectRatio - Width/height ratio
 * @param {number|null} targetWidthMm - Desired width in mm
 * @param {number|null} targetHeightMm - Desired height in mm
 * @returns {Object} { meshWidth, meshHeight } in mm
 */
function calculateMeshDimensions(aspectRatio, targetWidthMm, targetHeightMm) {
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
function calculateTargetResolution(width, height, maxResolution) {
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
function resampleImage(image, width, height) {
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
function extractPixelData(canvas) {
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
function extractDepthValues(pixels, width, height) {
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
 * Create materials for mesh rendering
 * @param {Object} materialConfig - Material configuration
 * @returns {THREE.Material[]} Array of materials [topMaterial, bottomMaterial]
 */
function createMeshMaterials(materialConfig) {
  const { showTexture = true, textureMap = null, imageDataUrl = null, baseColor = "#808080" } = materialConfig;

  // Load texture if enabled
  let texture = null;
  if (showTexture !== false) {
    const textureLoader = new THREE.TextureLoader();
    // Use textureMap if provided, otherwise fall back to depth map
    const textureSource = textureMap || imageDataUrl;
    texture = textureLoader.load(textureSource);
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  // Create materials array
  const materials = [
    // Material 0: Top surface with optional texture
    new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
    // Material 1: Bottom and walls with solid color
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
  ];

  return materials;
}

/**
 * Build 3D mesh geometry from processed depth map
 * @param {Float32Array} depthMap - Processed depth values (0-1 range)
 * @param {number} width - Depth map width
 * @param {number} height - Depth map height
 * @param {Object} meshParams - Physical mesh parameters
 * @returns {Object} { geometry, segmentsX, segmentsY } - THREE.BufferGeometry and segment counts
 */
function buildMeshGeometry(depthMap, width, height, meshParams) {
  const { meshWidth, meshHeight, targetDepthMm, baseThicknessMm } = meshParams;

  // Create plane geometry - 1:1 pixel to vertex mapping
  const segmentsX = width - 1;
  const segmentsY = height - 1;

  // Arrays to store all vertices and faces
  const vertices = [];
  const faces = [];

  // 1. Create TOP SURFACE vertices with depth from depth map
  for (let i = 0; i <= segmentsY; i++) {
    for (let j = 0; j <= segmentsX; j++) {
      // Map geometry vertex to depth map pixel
      const imgX = Math.floor((j / segmentsX) * (width - 1));
      const imgY = Math.floor((i / segmentsY) * (height - 1));
      const depthValue = depthMap[imgY * width + imgX];

      // Position in 3D space
      const x = (j / segmentsX) * meshWidth - meshWidth / 2;
      const y = (i / segmentsY) * meshHeight - meshHeight / 2;
      const z = depthValue * targetDepthMm;

      vertices.push(new THREE.Vector3(x, y, z));
    }
  }

  // Create triangles for top surface
  for (let i = 0; i < segmentsY; i++) {
    for (let j = 0; j < segmentsX; j++) {
      const v1 = i * (segmentsX + 1) + j;
      const v2 = v1 + 1;
      const v3 = v1 + (segmentsX + 1);
      const v4 = v3 + 1;

      faces.push(v1, v2, v3);
      faces.push(v2, v4, v3);
    }
  }

  // 2. Create BOTTOM SURFACE vertices (flat base)
  const bottomStartIdx = vertices.length;
  for (let i = 0; i <= segmentsY; i++) {
    for (let j = 0; j <= segmentsX; j++) {
      const x = (j / segmentsX) * meshWidth - meshWidth / 2;
      const y = (i / segmentsY) * meshHeight - meshHeight / 2;
      const z = -baseThicknessMm;

      vertices.push(new THREE.Vector3(x, y, z));
    }
  }

  // Create triangles for bottom surface (reversed winding for correct normals)
  for (let i = 0; i < segmentsY; i++) {
    for (let j = 0; j < segmentsX; j++) {
      const v1 = bottomStartIdx + i * (segmentsX + 1) + j;
      const v2 = v1 + 1;
      const v3 = v1 + (segmentsX + 1);
      const v4 = v3 + 1;

      faces.push(v1, v3, v2); // Reversed winding
      faces.push(v2, v3, v4); // Reversed winding
    }
  }

  // 3. Create PERIMETER WALLS connecting top and bottom edges

  // Helper function to add wall quad with correct outward-facing normals
  const addWallQuad = (topIdx1, topIdx2, bottomIdx1, bottomIdx2) => {
    // Counter-clockwise winding for outward-facing normals
    faces.push(topIdx1, bottomIdx1, topIdx2);
    faces.push(topIdx2, bottomIdx1, bottomIdx2);
  };

  // Bottom edge (y = 0)
  for (let j = 0; j < segmentsX; j++) {
    const topIdx1 = j;
    const topIdx2 = j + 1;
    const bottomIdx1 = bottomStartIdx + j;
    const bottomIdx2 = bottomStartIdx + j + 1;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Right edge (x = segmentsX)
  for (let i = 0; i < segmentsY; i++) {
    const topIdx1 = i * (segmentsX + 1) + segmentsX;
    const topIdx2 = (i + 1) * (segmentsX + 1) + segmentsX;
    const bottomIdx1 = bottomStartIdx + i * (segmentsX + 1) + segmentsX;
    const bottomIdx2 = bottomStartIdx + (i + 1) * (segmentsX + 1) + segmentsX;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Top edge (y = segmentsY)
  for (let j = segmentsX; j > 0; j--) {
    const topIdx1 = segmentsY * (segmentsX + 1) + j;
    const topIdx2 = segmentsY * (segmentsX + 1) + j - 1;
    const bottomIdx1 = bottomStartIdx + segmentsY * (segmentsX + 1) + j;
    const bottomIdx2 = bottomStartIdx + segmentsY * (segmentsX + 1) + j - 1;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Left edge (x = 0)
  for (let i = segmentsY; i > 0; i--) {
    const topIdx1 = i * (segmentsX + 1);
    const topIdx2 = (i - 1) * (segmentsX + 1);
    const bottomIdx1 = bottomStartIdx + i * (segmentsX + 1);
    const bottomIdx2 = bottomStartIdx + (i - 1) * (segmentsX + 1);
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry();

  // Convert vertices to flat array
  const positionsArray = new Float32Array(vertices.length * 3);
  vertices.forEach((v, i) => {
    positionsArray[i * 3] = v.x;
    positionsArray[i * 3 + 1] = v.y;
    positionsArray[i * 3 + 2] = v.z;
  });

  geometry.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();

  // Generate UV coordinates for texture mapping
  const uvs = new Float32Array(vertices.length * 2);
  const numCols = segmentsX + 1;
  vertices.forEach((v, i) => {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    uvs[i * 2] = col / segmentsX; // U coordinate (0-1)
    uvs[i * 2 + 1] = 1 - row / segmentsY; // V coordinate (0-1, flipped)
  });
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

  // Define material groups for different parts of the mesh
  // Group 0: Top surface (with texture)
  const topFaceCount = segmentsX * segmentsY * 2 * 3; // 2 triangles per quad, 3 vertices per triangle
  geometry.addGroup(0, topFaceCount, 0);

  // Group 1: Bottom and walls (solid color)
  const remainingFaces = faces.length - topFaceCount;
  geometry.addGroup(topFaceCount, remainingFaces, 1);

  return { geometry, segmentsX, segmentsY };
}

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
  const { width, height, originalWidth, originalHeight } = calculateTargetResolution(
    image.width,
    image.height,
    maxResolution
  );

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

  // Rotate to lie flat on XZ plane with relief pointing up
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.y = Math.PI;
  mesh.rotation.z = Math.PI;
  mesh.scale.z = -1;

  return mesh;
}

/**
 * Export mesh to STL format
 * @param {THREE.Mesh} mesh - The mesh to export
 * @returns {Blob}
 */
export function exportToSTL(mesh) {
  const exporter = new STLExporter();

  // STL format doesn't support materials or groups, so we need to create a clean mesh
  // Clone the geometry to avoid modifying the original
  const cleanGeometry = mesh.geometry.clone();

  // Remove material groups (they cause issues with STL export)
  cleanGeometry.clearGroups();

  // Apply the mesh's transformations directly to the geometry
  // This bakes the rotation and scale into the vertex positions
  cleanGeometry.applyMatrix4(mesh.matrix);

  // Apply additional 180° rotation around X-axis for correct STL orientation
  const fixRotation = new THREE.Matrix4().makeRotationX(Math.PI);
  cleanGeometry.applyMatrix4(fixRotation);

  // Check if we need to flip face winding due to negative scale
  // Negative scale inverts face normals, so we need to reverse the winding order
  const scale = mesh.scale;
  const hasNegativeScale = scale.x * scale.y * scale.z < 0;

  if (hasNegativeScale) {
    // Flip all triangle indices to reverse winding order
    const index = cleanGeometry.index;
    if (index) {
      const indices = index.array;
      for (let i = 0; i < indices.length; i += 3) {
        // Swap first and third vertex of each triangle
        const temp = indices[i];
        indices[i] = indices[i + 2];
        indices[i + 2] = temp;
      }
      index.needsUpdate = true;
    }
  }

  // Compute normals after applying transformations and fixing winding
  cleanGeometry.computeVertexNormals();

  // Create a temporary mesh with identity transform for export
  const exportMesh = new THREE.Mesh(cleanGeometry, new THREE.MeshBasicMaterial());
  // No need to copy transforms - they're already baked into the geometry

  // Use binary format for better performance and to avoid string length limits
  // Binary STL is much smaller and faster to generate than ASCII
  const stlBinary = exporter.parse(exportMesh, { binary: true });
  const stlBlob = new Blob([stlBinary], { type: "application/octet-stream" });

  console.log(`📦 STL exported: ${(stlBlob.size / (1024 * 1024)).toFixed(2)} MB (binary format)`);

  // Clean up
  cleanGeometry.dispose();

  return stlBlob;
}

/**
 * Load an image from a data URL
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Download the STL blob as a file
 */
export function download(blob, filename = "relief.stl") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
