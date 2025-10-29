/**
 * Material creation for 3D meshes
 */
import * as THREE from "three";

/**
 * Create materials for mesh rendering
 * @param {Object} materialConfig - Material configuration
 * @returns {THREE.Material[]} Array of materials [topMaterial, bottomMaterial]
 */
export function createMeshMaterials(materialConfig) {
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
