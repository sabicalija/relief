/**
 * 3D mesh building functions
 * Handles geometry construction from depth maps
 */
import * as THREE from "three";

/**
 * Build top surface vertices and faces from depth map
 * @param {Float32Array} depthMap - Depth values (0-1 range)
 * @param {number} width - Depth map width
 * @param {number} height - Depth map height
 * @param {Object} meshParams - Physical mesh parameters
 * @param {THREE.Vector3[]} vertices - Array to push vertices into
 * @param {number[]} faces - Array to push face indices into
 */
export function buildTopSurface(depthMap, width, height, meshParams, vertices, faces) {
  const { meshWidth, meshHeight, targetDepthMm } = meshParams;

  // Create TOP SURFACE vertices with depth from depth map
  // 1:1 mapping: each pixel becomes a vertex
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Get depth value from depth map
      const depthValue = depthMap[y * width + x];

      // Map pixel coordinates to physical mesh coordinates
      // Center the mesh at origin
      const meshX = (x / (width - 1)) * meshWidth - meshWidth / 2;
      const meshY = (y / (height - 1)) * meshHeight - meshHeight / 2;
      const meshZ = depthValue * targetDepthMm;

      vertices.push(new THREE.Vector3(meshX, meshY, meshZ));
    }
  }

  // Create triangles for top surface
  // Each quad (4 vertices) is split into 2 triangles
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      // Vertex indices for current quad
      const v1 = y * width + x;
      const v2 = v1 + 1;
      const v3 = v1 + width;
      const v4 = v3 + 1;

      // Triangle 1: v1 -> v2 -> v3
      faces.push(v1, v2, v3);
      // Triangle 2: v2 -> v4 -> v3
      faces.push(v2, v4, v3);
    }
  }
}

/**
 * Build bottom surface vertices and faces (flat base)
 * @param {number} width - Depth map width
 * @param {number} height - Depth map height
 * @param {Object} meshParams - Physical mesh parameters
 * @param {THREE.Vector3[]} vertices - Array to push vertices into
 * @param {number[]} faces - Array to push face indices into
 * @returns {number} Starting index of bottom vertices
 */
export function buildBottomSurface(width, height, meshParams, vertices, faces) {
  const { meshWidth, meshHeight, baseThicknessMm } = meshParams;

  // Create BOTTOM SURFACE vertices (flat base)
  const bottomStartIdx = vertices.length;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map pixel coordinates to physical mesh coordinates
      const meshX = (x / (width - 1)) * meshWidth - meshWidth / 2;
      const meshY = (y / (height - 1)) * meshHeight - meshHeight / 2;
      const meshZ = -baseThicknessMm;

      vertices.push(new THREE.Vector3(meshX, meshY, meshZ));
    }
  }

  // Create triangles for bottom surface (reversed winding for correct normals)
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      // Vertex indices for current quad
      const v1 = bottomStartIdx + y * width + x;
      const v2 = v1 + 1;
      const v3 = v1 + width;
      const v4 = v3 + 1;

      // Reversed winding for bottom face
      faces.push(v1, v3, v2);
      faces.push(v2, v3, v4);
    }
  }

  return bottomStartIdx;
}

/**
 * Build perimeter walls connecting top and bottom surfaces
 * @param {number} width - Depth map width
 * @param {number} height - Depth map height
 * @param {number} bottomStartIdx - Starting index of bottom vertices
 * @param {number[]} faces - Array to push face indices into
 */
export function buildPerimeterWalls(width, height, bottomStartIdx, faces) {
  // Helper function to add wall quad with correct outward-facing normals
  const addWallQuad = (topIdx1, topIdx2, bottomIdx1, bottomIdx2) => {
    // Counter-clockwise winding for outward-facing normals
    faces.push(topIdx1, bottomIdx1, topIdx2);
    faces.push(topIdx2, bottomIdx1, bottomIdx2);
  };

  // Bottom edge (y = 0)
  for (let x = 0; x < width - 1; x++) {
    const topIdx1 = x;
    const topIdx2 = x + 1;
    const bottomIdx1 = bottomStartIdx + x;
    const bottomIdx2 = bottomStartIdx + x + 1;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Right edge (x = width - 1)
  for (let y = 0; y < height - 1; y++) {
    const topIdx1 = y * width + (width - 1);
    const topIdx2 = (y + 1) * width + (width - 1);
    const bottomIdx1 = bottomStartIdx + y * width + (width - 1);
    const bottomIdx2 = bottomStartIdx + (y + 1) * width + (width - 1);
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Top edge (y = height - 1)
  for (let x = width - 1; x > 0; x--) {
    const topIdx1 = (height - 1) * width + x;
    const topIdx2 = (height - 1) * width + x - 1;
    const bottomIdx1 = bottomStartIdx + (height - 1) * width + x;
    const bottomIdx2 = bottomStartIdx + (height - 1) * width + x - 1;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }

  // Left edge (x = 0)
  for (let y = height - 1; y > 0; y--) {
    const topIdx1 = y * width;
    const topIdx2 = (y - 1) * width;
    const bottomIdx1 = bottomStartIdx + y * width;
    const bottomIdx2 = bottomStartIdx + (y - 1) * width;
    addWallQuad(topIdx1, topIdx2, bottomIdx1, bottomIdx2);
  }
}

/**
 * Setup geometry attributes (position and index) from vertices and faces
 * @param {THREE.BufferGeometry} geometry - Target geometry
 * @param {THREE.Vector3[]} vertices - Array of vertex positions
 * @param {number[]} faces - Array of face indices
 */
export function setupGeometryAttributes(geometry, vertices, faces) {
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
}

/**
 * Generate UV coordinates for texture mapping
 * @param {THREE.BufferGeometry} geometry - Target geometry
 * @param {THREE.Vector3[]} vertices - Array of vertex positions
 * @param {number} segmentsX - Number of segments in X direction
 * @param {number} segmentsY - Number of segments in Y direction
 */
export function generateUVCoordinates(geometry, vertices, segmentsX, segmentsY) {
  const uvs = new Float32Array(vertices.length * 2);
  const numCols = segmentsX + 1;
  vertices.forEach((v, i) => {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    uvs[i * 2] = col / segmentsX; // U coordinate (0-1)
    uvs[i * 2 + 1] = 1 - row / segmentsY; // V coordinate (0-1, flipped)
  });
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
}

/**
 * Setup material groups for different parts of the mesh
 * @param {THREE.BufferGeometry} geometry - Target geometry
 * @param {number} segmentsX - Number of segments in X direction
 * @param {number} segmentsY - Number of segments in Y direction
 * @param {number} totalFaces - Total number of face indices
 */
export function setupMaterialGroups(geometry, segmentsX, segmentsY, totalFaces) {
  // Group 0: Top surface (with texture)
  const topFaceCount = segmentsX * segmentsY * 2 * 3; // 2 triangles per quad, 3 vertices per triangle
  geometry.addGroup(0, topFaceCount, 0);

  // Group 1: Bottom and walls (solid color)
  const remainingFaces = totalFaces - topFaceCount;
  geometry.addGroup(topFaceCount, remainingFaces, 1);
}

/**
 * Build 3D mesh geometry from processed depth map
 * @param {Float32Array} depthMap - Processed depth values (0-1 range)
 * @param {number} width - Depth map width
 * @param {number} height - Depth map height
 * @param {Object} meshParams - Physical mesh parameters
 * @returns {Object} { geometry, segmentsX, segmentsY } - THREE.BufferGeometry and segment counts
 */
export function buildMeshGeometry(depthMap, width, height, meshParams) {
  // Create plane geometry - 1:1 pixel to vertex mapping
  const segmentsX = width - 1;
  const segmentsY = height - 1;

  // Arrays to store all vertices and faces
  const vertices = [];
  const faces = [];

  // 1. Build TOP SURFACE
  buildTopSurface(depthMap, width, height, meshParams, vertices, faces);

  // 2. Build BOTTOM SURFACE
  const bottomStartIdx = buildBottomSurface(width, height, meshParams, vertices, faces);

  // 3. Build PERIMETER WALLS
  buildPerimeterWalls(width, height, bottomStartIdx, faces);

  // 4. Create BufferGeometry and setup attributes
  const geometry = new THREE.BufferGeometry();
  setupGeometryAttributes(geometry, vertices, faces);

  // 5. Generate UV coordinates for texture mapping
  generateUVCoordinates(geometry, vertices, segmentsX, segmentsY);

  // 6. Define material groups for different parts of the mesh
  setupMaterialGroups(geometry, segmentsX, segmentsY, faces.length);

  return { geometry, segmentsX, segmentsY };
}
