/**
 * OBJ export utilities
 */
import * as THREE from "three";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter.js";

/**
 * Export mesh to OBJ format
 * @param {THREE.Mesh} mesh - The mesh to export
 * @param {string} objectName - Optional name for the object in the OBJ file
 * @returns {Blob}
 */
export function exportToOBJ(mesh, objectName = "ReliefModel") {
  const exporter = new OBJExporter();

  // Clone the geometry to avoid modifying the original
  const cleanGeometry = mesh.geometry.clone();

  // Remove material groups (they cause issues with OBJ export)
  cleanGeometry.clearGroups();

  // Apply the mesh's transformations directly to the geometry
  // This bakes the rotation and scale into the vertex positions
  cleanGeometry.applyMatrix4(mesh.matrix);

  // OBJ format uses Y-up coordinate system, but our mesh uses Z-up (Blender style)
  // Convert from Z-up to Y-up: swap Y and Z, negate new Z
  // This ensures the model loads correctly in Blender and other Y-up software
  const toYUp = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  cleanGeometry.applyMatrix4(toYUp);

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

  // Set object name for OBJ file
  exportMesh.name = objectName;

  // Export to OBJ format (text-based)
  const objText = exporter.parse(exportMesh);
  const objBlob = new Blob([objText], { type: "text/plain" });

  console.log(`📦 OBJ exported: ${(objBlob.size / 1024).toFixed(2)} KB (text format)`);

  // Clean up
  cleanGeometry.dispose();

  return objBlob;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export function download(blob, filename = "relief.obj") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
