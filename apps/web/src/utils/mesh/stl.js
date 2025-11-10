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

  // Clone the geometry to avoid modifying the original
  let cleanGeometry = mesh.geometry.clone();

  // Remove material groups (STL doesn't support them)
  cleanGeometry.clearGroups();

  // Apply the original mesh's world transform to bake it into the geometry
  const tempMesh = new THREE.Mesh(cleanGeometry, new THREE.MeshBasicMaterial());
  tempMesh.position.copy(mesh.position);
  tempMesh.rotation.copy(mesh.rotation);
  tempMesh.scale.copy(mesh.scale);
  tempMesh.updateMatrix();
  cleanGeometry.applyMatrix4(tempMesh.matrix);

  // IMPORTANT: Flip all face winding orders for STL export
  // Three.js and STL use opposite winding conventions
  // STL expects counter-clockwise winding when viewed from outside (right-hand rule)
  const index = cleanGeometry.index;
  if (index) {
    const indices = index.array;
    for (let i = 0; i < indices.length; i += 3) {
      // Swap first and third vertex to reverse winding
      const temp = indices[i];
      indices[i] = indices[i + 2];
      indices[i + 2] = temp;
    }
    index.needsUpdate = true;
    console.log(`🔄 Reversed winding order for ${(indices.length / 3).toLocaleString()} triangles`);
  }

  // Compute vertex normals after winding fix
  cleanGeometry.computeVertexNormals();

  // Create final export mesh with identity transform
  const finalMesh = new THREE.Mesh(cleanGeometry, new THREE.MeshBasicMaterial());

  // Use binary format for better performance
  const stlBinary = exporter.parse(finalMesh, { binary: true });
  const stlBlob = new Blob([stlBinary], { type: "application/octet-stream" });

  console.log(`📦 STL exported: ${(stlBlob.size / (1024 * 1024)).toFixed(2)} MB (binary format)`);
  console.log(`   Vertices: ${cleanGeometry.attributes.position.count.toLocaleString()}`);
  console.log(
    `   Triangles: ${(cleanGeometry.index
      ? cleanGeometry.index.count / 3
      : cleanGeometry.attributes.position.count / 3
    ).toLocaleString()}`
  );

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
