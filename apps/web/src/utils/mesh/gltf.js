/**
 * GLTF/GLB export utilities
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/**
 * Export mesh to GLTF/GLB format
 * @param {THREE.Mesh} mesh - The mesh to export
 * @param {string} objectName - Optional name for the object
 * @param {boolean} binary - Export as binary GLB (true) or JSON GLTF (false)
 * @returns {Promise<Blob>}
 */
export async function exportToGLTF(mesh, objectName = "ReliefModel", binary = true) {
  const exporter = new GLTFExporter();

  // Clone the mesh to avoid modifying the original
  const exportMesh = mesh.clone();
  exportMesh.name = objectName;

  // Clone material to preserve colors and textures
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      exportMesh.material = mesh.material.map((mat, index) => {
        const clonedMat = mat.clone();
        // Ensure texture is properly referenced with GLTF-compatible settings
        if (mat.map) {
          clonedMat.map = mat.map.clone();
          clonedMat.map.flipY = true; // Flip Y to match our UV coordinates
          clonedMat.map.colorSpace = THREE.SRGBColorSpace;
          clonedMat.needsUpdate = true;
          console.log(`📸 Texture configured for material ${index}`);
        } else {
          console.log(`🎨 Material ${index} has no texture (solid color)`);
        }
        return clonedMat;
      });
    } else if (mesh.material.clone) {
      exportMesh.material = mesh.material.clone();
      // Ensure texture is properly referenced with GLTF-compatible settings
      if (mesh.material.map) {
        exportMesh.material.map = mesh.material.map.clone();
        exportMesh.material.map.flipY = true; // Flip Y to match our UV coordinates
        exportMesh.material.map.colorSpace = THREE.SRGBColorSpace;
        exportMesh.material.needsUpdate = true;
        console.log("📸 Texture configured for GLTF export");
      }
    }
  }

  // Apply transformations to geometry
  exportMesh.geometry = mesh.geometry.clone();

  // Log geometry info for debugging
  console.log("🔍 Geometry info:", {
    hasUV: !!exportMesh.geometry.attributes.uv,
    groups: exportMesh.geometry.groups.length,
    materialCount: Array.isArray(exportMesh.material) ? exportMesh.material.length : 1,
  });
  exportMesh.geometry.applyMatrix4(mesh.matrix);
  exportMesh.position.set(0, 0, 0);
  exportMesh.rotation.set(0, 0, 0);
  exportMesh.scale.set(1, 1, 1);
  exportMesh.updateMatrix();

  // GLTF format uses Y-up coordinate system, but our mesh uses Z-up (Blender style)
  // Convert from Z-up to Y-up for proper orientation in GLTF viewers
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

  return new Promise((resolve, reject) => {
    exporter.parse(
      exportMesh,
      (result) => {
        let blob;
        if (binary) {
          // GLB - binary format
          blob = new Blob([result], { type: "model/gltf-binary" });
          console.log(`📦 GLB exported: ${(blob.size / 1024).toFixed(2)} KB (binary format)`);
        } else {
          // GLTF - JSON format
          const output = JSON.stringify(result, null, 2);
          blob = new Blob([output], { type: "model/gltf+json" });
          console.log(`📦 GLTF exported: ${(blob.size / 1024).toFixed(2)} KB (JSON format)`);
        }

        // Clean up
        exportMesh.geometry.dispose();

        resolve(blob);
      },
      (error) => {
        console.error("GLTF export error:", error);
        exportMesh.geometry.dispose();
        reject(error);
      },
      {
        binary,
        embedImages: true, // Embed textures in the file
        maxTextureSize: 4096, // Limit texture size
      }
    );
  });
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename to use
 */
export function download(blob, filename = "relief.glb") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
