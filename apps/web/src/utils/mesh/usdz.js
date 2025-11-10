/**
 * USDZ export utilities
 */
import * as THREE from "three";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

/**
 * Export mesh to USDZ format (Apple AR)
 * @param {THREE.Mesh} mesh - The mesh to export
 * @param {string} objectName - Optional name for the object
 * @returns {Promise<Blob>}
 */
export async function exportToUSDZ(mesh, objectName = "ReliefModel") {
  const exporter = new USDZExporter();

  // Clone the mesh to avoid modifying the original
  const exportMesh = mesh.clone();
  exportMesh.name = objectName;

  // Clone material to preserve colors and textures
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      exportMesh.material = mesh.material.map((mat) => mat.clone());
    } else if (mesh.material.clone) {
      exportMesh.material = mesh.material.clone();
    }
  }

  // Apply transformations to geometry
  exportMesh.geometry = mesh.geometry.clone();
  exportMesh.geometry.applyMatrix4(mesh.matrix);
  exportMesh.position.set(0, 0, 0);
  exportMesh.rotation.set(0, 0, 0);
  exportMesh.scale.set(1, 1, 1);
  exportMesh.updateMatrix();

  // USDZ format uses Y-up coordinate system, but our mesh uses Z-up (Blender style)
  // Convert from Z-up to Y-up for proper orientation in AR viewers
  const toYUp = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  exportMesh.geometry.applyMatrix4(toYUp);

  // Check if we need to flip face winding due to negative scale
  const scale = mesh.scale;
  const hasNegativeScale = scale.x * scale.y * scale.z < 0;

  if (hasNegativeScale) {
    const index = exportMesh.geometry.index;
    if (index) {
      const indices = index.array;
      for (let i = 0; i < indices.length; i += 3) {
        const temp = indices[i];
        indices[i] = indices[i + 2];
        indices[i + 2] = temp;
      }
      index.needsUpdate = true;
    }
  }

  exportMesh.geometry.computeVertexNormals();

  try {
    const result = await exporter.parse(exportMesh);
    const blob = new Blob([result], { type: "model/vnd.usdz+zip" });

    console.log(`📦 USDZ exported: ${(blob.size / 1024).toFixed(2)} KB (Apple AR format)`);

    // Clean up
    exportMesh.geometry.dispose();

    return blob;
  } catch (error) {
    console.error("USDZ export error:", error);
    exportMesh.geometry.dispose();
    throw error;
  }
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export function download(blob, filename = "relief.usdz") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
