/**
 * PLY export utilities
 */
import * as THREE from "three";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";

/**
 * Export mesh to PLY format
 * @param {THREE.Mesh} mesh - The mesh to export
 * @param {string} objectName - Optional name for the object (used in comments)
 * @returns {Blob}
 */
export function exportToPLY(mesh, objectName = "ReliefModel") {
  const exporter = new PLYExporter();

  // Clone the geometry to avoid modifying the original
  const cleanGeometry = mesh.geometry.clone();

  // Remove material groups (they cause issues with PLY export)
  cleanGeometry.clearGroups();

  // Apply the mesh's transformations directly to the geometry
  // This bakes the rotation and scale into the vertex positions
  cleanGeometry.applyMatrix4(mesh.matrix);

  // Check if we need to flip face winding due to negative scale
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
  exportMesh.name = objectName;

  // Export to PLY format (binary for smaller file size)
  const plyData = exporter.parse(exportMesh, { binary: true });
  const plyBlob = new Blob([plyData], { type: "application/octet-stream" });

  console.log(`📦 PLY exported: ${(plyBlob.size / 1024).toFixed(2)} KB (binary format)`);

  // Clean up
  cleanGeometry.dispose();

  return plyBlob;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export function download(blob, filename = "relief.ply") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
