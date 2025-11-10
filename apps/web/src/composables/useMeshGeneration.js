/**
 * Mesh Generation Composable
 * Manages 3D mesh lifecycle: generation, disposal, and reactive updates
 */
import { ref, watch, markRaw } from "vue";
import { createMeshFromDepthMap } from "../utils/mesh/index.js";

/**
 * Dispose a Three.js mesh and all its resources (geometry, materials, textures)
 * @param {THREE.Mesh} meshToDispose - The mesh to dispose
 */
function disposeMesh(meshToDispose) {
  if (!meshToDispose) return;

  // Remove from scene
  if (meshToDispose.parent) {
    meshToDispose.parent.remove(meshToDispose);
  }

  // Dispose geometry
  if (meshToDispose.geometry) {
    meshToDispose.geometry.dispose();
  }

  // Dispose materials and textures
  if (meshToDispose.material) {
    const materials = Array.isArray(meshToDispose.material) ? meshToDispose.material : [meshToDispose.material];
    materials.forEach((m) => {
      // Dispose all textures
      if (m.map) m.map.dispose();
      if (m.normalMap) m.normalMap.dispose();
      if (m.roughnessMap) m.roughnessMap.dispose();
      if (m.metalnessMap) m.metalnessMap.dispose();
      // Dispose material
      m.dispose();
    });
  }
}

/**
 * Composable for mesh generation and lifecycle management
 * @param {Object} options - Configuration options
 * @param {import('vue').Ref} options.depthMap - Reactive ref to depth map data URL
 * @param {import('vue').ComputedRef} options.meshConfig - Computed mesh configuration
 * @param {Object} options.statusStore - Viewer store for notifications (backward compatible parameter name)
 * @returns {Object} Mesh state and methods
 */
export function useMeshGeneration({ depthMap, meshConfig, statusStore: viewerStore }) {
  const mesh = ref(null);
  const isGenerating = ref(false);

  /**
   * Generate mesh from depth map with status notifications
   * @param {string} depthMapData - Depth map data URL
   * @param {Object} config - Mesh configuration
   * @param {boolean} showStatusMessages - Whether to show status notifications
   */
  async function generateMesh(depthMapData, config, showStatusMessages = true) {
    if (!depthMapData) {
      mesh.value = null;
      return;
    }

    isGenerating.value = true;
    let statusId = null;

    if (showStatusMessages) {
      statusId = viewerStore.showGenerating("Generating 3D mesh...");
      console.log("🔄 Generating mesh from depth map...");
    } else {
      console.log("🔄 Regenerating mesh due to parameter change...");
    }

    try {
      let newMesh;

      // Check if simplification will be applied (needs status indicator)
      const willSimplify = config.geometrySimplification < 0.99;

      if (showStatusMessages) {
        // Ensure minimum display time for status message (initial generation)
        [newMesh] = await Promise.all([
          createMeshFromDepthMap(depthMapData, config, willSimplify ? viewerStore : null),
          new Promise((resolve) => setTimeout(resolve, 300)), // Minimum 300ms display
        ]);
      } else {
        // No minimum delay for parameter changes, but still show status for simplification
        newMesh = await createMeshFromDepthMap(depthMapData, config, willSimplify ? viewerStore : null);
      }

      // Dispose old mesh completely
      disposeMesh(mesh.value);

      // Use markRaw to prevent Vue from making Three.js objects reactive
      mesh.value = markRaw(newMesh);

      if (showStatusMessages) {
        console.log("✅ Mesh generated successfully");
        viewerStore.removeStatus(statusId);
        viewerStore.showSuccess("Mesh generated successfully", 2000);
      } else {
        console.log("✅ Mesh regenerated successfully");
      }
    } catch (error) {
      console.error("❌ Error generating mesh:", error);
      if (showStatusMessages) {
        viewerStore.removeStatus(statusId);
        viewerStore.showError(`Error generating mesh: ${error.message}`, 5000);
      }
    } finally {
      isGenerating.value = false;
    }
  }

  // Watch for depth map changes (initial generation)
  watch(
    depthMap,
    async (newDepthMap) => {
      await generateMesh(newDepthMap, meshConfig.value, true);
    },
    { immediate: true }
  );

  // Watch for parameter changes (regeneration without new depth map)
  // Exclude itemColor from triggering full regeneration
  watch(
    () => {
      const { itemColor, ...rest } = meshConfig.value;
      return rest;
    },
    async (newConfig) => {
      if (!depthMap.value) return;
      await generateMesh(depthMap.value, { ...newConfig, itemColor: meshConfig.value.itemColor }, false);
    }
  );

  // Watch itemColor separately - just update material color
  watch(
    () => meshConfig.value.itemColor,
    (newColor) => {
      if (!mesh.value) return;
      if (!mesh.value.material) return;

      // Determine if top surface has a texture
      const hasTexture = mesh.value.material[0]?.map !== null;

      // Top surface: white if texture present (to avoid tinting), otherwise itemColor
      if (mesh.value.material[0]) {
        mesh.value.material[0].color.set(hasTexture ? "#ffffff" : newColor);
      }

      // Bottom/walls: always use itemColor
      if (mesh.value.material[1]) {
        mesh.value.material[1].color.set(newColor);
      }
    }
  );

  return {
    mesh,
    isGenerating,
    generateMesh,
    disposeMesh,
  };
}
