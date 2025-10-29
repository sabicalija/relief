/**
 * STL export utilities
 */
import * as THREE from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

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
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export function download(blob, filename = "relief.stl") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
