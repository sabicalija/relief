import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

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
  let { width, height } = image;
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

  // Calculate dimensions
  const aspectRatio = width / height;
  let meshWidth, meshHeight;

  if (targetWidthMm && targetHeightMm) {
    meshWidth = targetWidthMm;
    meshHeight = targetHeightMm;
  } else if (targetWidthMm) {
    meshWidth = targetWidthMm;
    meshHeight = targetWidthMm / aspectRatio;
  } else if (targetHeightMm) {
    meshHeight = targetHeightMm;
    meshWidth = targetHeightMm * aspectRatio;
  } else {
    meshWidth = 100;
    meshHeight = 100 / aspectRatio;
  }

  // Create canvas to extract depth data
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Analyze image to detect colormap type and whether to invert
  const { colormapType, shouldInvert } = detectColormapType(pixels, width, height);
  console.log("🎨 Detected colormap type:", colormapType, "| Should invert:", shouldInvert);

  // Sample a few pixels to show what we're detecting
  console.log("📊 Sample depth conversions:");
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(((i / 5) * pixels.length) / 4) * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    const depth = rgbToDepth(r, g, b, colormapType, shouldInvert);
    console.log(`  RGB(${r}, ${g}, ${b}) → depth: ${depth.toFixed(3)}`);
  }

  // Create plane geometry - 1:1 pixel to vertex mapping after resampling
  // Use the resampled resolution (already limited by maxResolution above)
  // No further reduction needed - the image is already at a reasonable size
  const segmentsX = width - 1;
  const segmentsY = height - 1;

  const totalVertices = (segmentsX + 1) * (segmentsY + 1);
  const isFullResolution = segmentsX === width - 1 && segmentsY === height - 1;
  console.log(
    `🔷 Mesh resolution: ${segmentsX + 1}×${segmentsY + 1} vertices (${totalVertices.toLocaleString()} total)${
      isFullResolution ? " ✓ FULL RESOLUTION" : " ⚠️ LIMITED"
    }`
  );

  // Arrays to store all vertices and faces
  const vertices = [];
  const faces = [];

  // 1. Create TOP SURFACE vertices with depth from image
  // Push directly to vertices array to avoid intermediate array and spread operator issues
  for (let i = 0; i <= segmentsY; i++) {
    for (let j = 0; j <= segmentsX; j++) {
      // Map geometry vertex to image pixel
      const imgX = Math.floor((j / segmentsX) * (width - 1));
      const imgY = Math.floor((i / segmentsY) * (height - 1));
      const pixelIndex = (imgY * width + imgX) * 4;

      // Extract RGB values and convert to depth
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const depthValue = rgbToDepth(r, g, b, colormapType, shouldInvert); // Handles both grayscale and colormap images

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

  // Load texture from depth map image (if enabled)
  let texture = null;
  if (config.showTexture !== false) {
    const textureLoader = new THREE.TextureLoader();
    texture = textureLoader.load(imageDataUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
  }

  // Create materials array
  const baseColor = config.baseColor || "#808080";
  const materials = [
    // Material 0: Top surface with optional texture
    new THREE.MeshStandardMaterial({
      map: texture, // Apply the depth map as texture (or null)
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

  const mesh = new THREE.Mesh(geometry, materials);

  // Store mesh resolution as user data for display
  mesh.userData.resolution = {
    width: segmentsX + 1,
    height: segmentsY + 1,
    total: totalVertices,
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
  const stlString = exporter.parse(mesh, { binary: false });
  const stlBlob = new Blob([stlString], { type: "text/plain" });
  return stlBlob;
}

/**
 * Detect the type of colormap used in the depth image
 * @param {Uint8ClampedArray} pixels - Image pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Object} - {colormapType: string, shouldInvert: boolean}
 */
function detectColormapType(pixels, width, height) {
  let grayscaleCount = 0;
  let colorCount = 0;
  let totalSaturation = 0;
  let totalBrightness = 0;
  let redCount = 0;
  let blueCount = 0;

  // Sample pixels (check every 10th pixel for performance)
  const sampleRate = 10;
  let sampleCount = 0;

  for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const isGray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
    if (isGray) {
      grayscaleCount++;
    } else {
      colorCount++;

      const hsv = rgbToHsv(r, g, b);
      totalSaturation += hsv.s;
      totalBrightness += hsv.v;

      // Count red-ish (hue 0-60 or 300-360) and blue-ish (hue 180-270) pixels
      if ((hsv.h >= 0 && hsv.h <= 60) || hsv.h >= 300) {
        redCount++;
      } else if (hsv.h >= 180 && hsv.h <= 270) {
        blueCount++;
      }
    }
    sampleCount++;
  }

  // Determine colormap type based on statistics
  const grayscaleRatio = grayscaleCount / sampleCount;

  if (grayscaleRatio > 0.9) {
    return { colormapType: "grayscale", shouldInvert: false };
  }

  const avgSaturation = totalSaturation / colorCount;
  const hasRedBlue = (redCount + blueCount) / colorCount > 0.3;

  // For colormaps, we generally don't need to invert
  // But this could be adjusted based on specific colormap detection
  let shouldInvert = false;

  // High saturation + red-blue presence = spectral/jet/turbo colormap
  if (avgSaturation > 0.4 && hasRedBlue) {
    return { colormapType: "spectral", shouldInvert };
  }

  // Low saturation = sequential colormap like inferno/viridis
  if (avgSaturation < 0.3) {
    return { colormapType: "sequential", shouldInvert };
  }

  // Default: thermal (red-yellow-white or similar)
  return { colormapType: "thermal", shouldInvert };
}

/**
 * Convert RGB to HSV color space
 * @returns {Object} - {h: 0-360, s: 0-1, v: 0-1}
 */
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6;
    } else {
      h = ((r - g) / diff + 4) / 6;
    }
  }

  return { h: h * 360, s, v };
}

/**
 * Turbo colormap reference points (commonly used by Depth Anything V2)
 * Perceptually uniform: Blue (0.0/far) to Red (1.0/near)
 * Based on Google's Turbo colormap
 */
const TURBO_MAP = [
  [48, 18, 59], // 0.00 - dark blue
  [62, 73, 137], // 0.10
  [67, 125, 190], // 0.20
  [64, 176, 220], // 0.30 - cyan
  [85, 219, 200], // 0.40
  [142, 242, 158], // 0.50 - green
  [203, 245, 106], // 0.60
  [249, 229, 68], // 0.70 - yellow
  [253, 175, 43], // 0.80 - orange
  [237, 106, 32], // 0.90
  [180, 4, 38], // 1.00 - dark red
];

/**
 * Jet colormap reference (traditional, less perceptual)
 * Blue (0.0) through cyan, green, yellow to red (1.0)
 */
const JET_MAP = [
  [0, 0, 143], // 0.0 - dark blue
  [0, 0, 255], // 0.167 - blue
  [0, 255, 255], // 0.333 - cyan
  [0, 255, 0], // 0.5 - green
  [255, 255, 0], // 0.667 - yellow
  [255, 0, 0], // 0.833 - red
  [128, 0, 0], // 1.0 - dark red
];

/**
 * Inferno colormap reference (sequential, perceptual)
 * Dark purple (0.0) to bright yellow (1.0)
 */
const INFERNO_MAP = [
  [0, 0, 4], // 0.0
  [40, 11, 84], // 0.2
  [101, 21, 110], // 0.4
  [159, 42, 99], // 0.6
  [212, 72, 66], // 0.8
  [252, 255, 164], // 1.0
];

/**
 * Find closest colormap entry and interpolate depth value
 */
function findClosestColormapValue(r, g, b, colormapRef) {
  let minDist = Infinity;
  let bestIdx = 0;

  // Find closest color in reference map
  for (let i = 0; i < colormapRef.length; i++) {
    const [refR, refG, refB] = colormapRef[i];
    const dist = Math.sqrt(Math.pow(r - refR, 2) + Math.pow(g - refG, 2) + Math.pow(b - refB, 2));
    if (dist < minDist) {
      minDist = dist;
      bestIdx = i;
    }
  }

  // Convert index to depth value (0-1)
  return bestIdx / (colormapRef.length - 1);
}

/**
 * Convert colormap RGB to depth value
 * Tries multiple strategies to correctly interpret different colormaps
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @param {string} colormapType - Type of colormap: 'grayscale', 'spectral', 'thermal', 'sequential'
 * @param {boolean} shouldInvert - Whether to invert the depth values
 * @returns {number} - Depth value (0-1)
 */
function rgbToDepth(r, g, b, colormapType = "grayscale", shouldInvert = false) {
  const rNorm = r / 255.0;
  const gNorm = g / 255.0;
  const bNorm = b / 255.0;

  let depth;

  // For grayscale images, use simple brightness
  if (colormapType === "grayscale") {
    depth = rNorm; // Since R≈G≈B, just use R
  }
  // For spectral/turbo colormaps (most common for depth maps like Depth Anything V2)
  // Try Turbo first, fall back to Jet
  else if (colormapType === "spectral") {
    const turboDepth = findClosestColormapValue(r, g, b, TURBO_MAP);
    const jetDepth = findClosestColormapValue(r, g, b, JET_MAP);
    // Use whichever colormap the color is closer to
    depth = turboDepth; // Default to Turbo as it's more modern and perceptual
  }
  // For sequential colormaps (inferno, viridis), use lookup table
  else if (colormapType === "sequential") {
    depth = findClosestColormapValue(r, g, b, INFERNO_MAP);
  }
  // For thermal or unknown, use Turbo as best guess
  else {
    depth = findClosestColormapValue(r, g, b, TURBO_MAP);
  }

  // Apply inversion if needed
  return shouldInvert ? 1.0 - depth : depth;
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
