import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

/**
 * Convert a depth map image to a 3D mesh
 * @param {string} imageDataUrl - Base64 data URL of the depth map image
 * @param {Object} config - Configuration parameters
 * @returns {Promise<THREE.Mesh>}
 */
export async function createMeshFromDepthMap(imageDataUrl, config) {
  const { targetDepthMm = 20.0, baseThicknessMm = 10.0, targetWidthMm = null, targetHeightMm = null } = config;

  // Load the depth map image
  const image = await loadImage(imageDataUrl);
  let { width, height } = image;

  // Downsample large images to avoid memory issues
  const maxResolution = 256;
  if (width > maxResolution || height > maxResolution) {
    const scale = maxResolution / Math.max(width, height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
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

  // Create plane geometry with reduced resolution
  const segmentsX = Math.min(width - 1, 128);
  const segmentsY = Math.min(height - 1, 128);

  // Arrays to store all vertices and faces
  const vertices = [];
  const faces = [];

  // 1. Create TOP SURFACE vertices with depth from image
  const topVertices = [];
  for (let i = 0; i <= segmentsY; i++) {
    for (let j = 0; j <= segmentsX; j++) {
      // Map geometry vertex to image pixel
      const imgX = Math.floor((j / segmentsX) * (width - 1));
      const imgY = Math.floor((i / segmentsY) * (height - 1));
      const pixelIndex = (imgY * width + imgX) * 4;

      // Use grayscale value (average RGB for non-grayscale images)
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const depthValue = (r + g + b) / (3 * 255.0); // Normalize to 0-1

      // Position in 3D space
      const x = (j / segmentsX) * meshWidth - meshWidth / 2;
      const y = (i / segmentsY) * meshHeight - meshHeight / 2;
      const z = depthValue * targetDepthMm;

      topVertices.push(new THREE.Vector3(x, y, z));
    }
  }
  vertices.push(...topVertices);

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

  // Load texture from depth map image
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(imageDataUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Create mesh with texture
  const material = new THREE.MeshStandardMaterial({
    map: texture, // Apply the depth map as texture
    metalness: 0.3,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);

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
