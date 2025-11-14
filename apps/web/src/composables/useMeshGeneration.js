/**
 * Mesh Generation Composable
 * Manages 3D mesh lifecycle: generation, disposal, and reactive updates
 */
import { ref, watch, markRaw, onUnmounted } from "vue";
import * as THREE from "three";
import { createMeshMaterials } from "../utils/mesh/material.js";
import MeshWorker from "../workers/mesh-generation.worker.js?worker";

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
// Track composable instances for debugging
let instanceCounter = 0;

export function useMeshGeneration({ depthMap, meshConfig, statusStore: viewerStore }) {
  const instanceId = ++instanceCounter;
  console.log(`🔧 useMeshGeneration instance #${instanceId} created`);

  const mesh = ref(null);
  const isGenerating = ref(false);

  // Create worker instance
  const worker = new MeshWorker();
  let currentGenerationId = 0;

  // Track if meshConfig watcher should skip first execution
  let skipFirstMeshConfigWatch = true;

  /**
   * Generate mesh from depth map with status notifications (using Web Worker)
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
    const generationId = ++currentGenerationId;
    let statusId = null;
    let simplificationStatusId = null;

    if (showStatusMessages) {
      statusId = viewerStore.showGenerating("Generating 3D mesh...");
      console.log("🔄 Generating mesh from depth map (in Web Worker)...");
    } else {
      console.log("🔄 Regenerating mesh due to parameter change (in Web Worker)...");
    }

    try {
      // Send generation request to worker
      const meshData = await new Promise((resolve, reject) => {
        const handleMessage = (event) => {
          const { type, data, error } = event.data;

          if (type === "simplification-start") {
            // Show simplification status
            if (simplificationStatusId) {
              viewerStore.removeStatus(simplificationStatusId);
            }
            simplificationStatusId = viewerStore.addStatus(
              `Simplifying geometry (${data.originalVertices.toLocaleString()} vertices → ${Math.round(
                data.originalVertices * data.targetRatio
              ).toLocaleString()} target)...`,
              "spinner",
              { priority: 9 }
            );
          } else if (type === "simplification-complete") {
            // Update simplification status
            if (simplificationStatusId) {
              viewerStore.removeStatus(simplificationStatusId);
              simplificationStatusId = null;
            }
          } else if (type === "success") {
            worker.removeEventListener("message", handleMessage);
            resolve(data);
          } else if (type === "error") {
            worker.removeEventListener("message", handleMessage);
            reject(new Error(error.message));
          }
        };

        worker.addEventListener("message", handleMessage);
        worker.postMessage({
          type: "generate",
          data: {
            imageDataUrl: depthMapData,
            config: config,
          },
        });
      });

      // Check if this generation is still current (user might have triggered another)
      if (generationId !== currentGenerationId) {
        console.log(`⏭️  Generation ${generationId} cancelled (newer generation in progress)`);
        return;
      }

      // Minimum display time for initial generation
      if (showStatusMessages) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Deserialize geometry from worker data
      // Manually reconstruct BufferGeometry from JSON data
      const geometry = new THREE.BufferGeometry();
      const geoData = meshData.geometryData.data;

      if (!geoData) {
        throw new Error("Invalid geometry data received from worker");
      }

      // Set attributes (position, normal, uv, etc.)
      if (geoData.attributes) {
        for (const [name, attrData] of Object.entries(geoData.attributes)) {
          const array = new Float32Array(attrData.array);
          geometry.setAttribute(name, new THREE.BufferAttribute(array, attrData.itemSize));
        }
      }

      // Set index if present
      if (geoData.index) {
        const indexArray = new Uint32Array(geoData.index.array);
        geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
      }

      // Set groups if present (for multi-material meshes)
      if (geoData.groups) {
        for (const group of geoData.groups) {
          geometry.addGroup(group.start, group.count, group.materialIndex);
        }
      } // Create materials on main thread (requires DOM for texture loading)
      const materials = createMeshMaterials({
        showTexture: meshData.metadata.showTexture,
        textureMap: meshData.metadata.textureMap,
        imageDataUrl: meshData.metadata.imageDataUrl,
        itemColor: meshData.metadata.itemColor,
      });

      // Create the mesh
      const newMesh = new THREE.Mesh(geometry, materials);

      // Store metadata
      newMesh.userData.resolution = meshData.metadata.resolution;
      newMesh.userData.simplified = meshData.metadata.wasSimplified;
      newMesh.userData.hasTexture = meshData.metadata.showTexture;

      // Dispose old mesh completely
      disposeMesh(mesh.value);

      // Use markRaw to prevent Vue from making Three.js objects reactive
      mesh.value = markRaw(newMesh);

      if (showStatusMessages) {
        console.log("✅ Mesh generated successfully (via Web Worker)");
        viewerStore.removeStatus(statusId);
        viewerStore.showSuccess("Mesh generated successfully", 2000);
      } else {
        console.log("✅ Mesh regenerated successfully (via Web Worker)");
      }
    } catch (error) {
      console.error("❌ Error generating mesh in worker:", error);
      if (showStatusMessages && statusId) {
        viewerStore.removeStatus(statusId);
        viewerStore.showError(`Error generating mesh: ${error.message}`, 5000);
      }
      if (simplificationStatusId) {
        viewerStore.removeStatus(simplificationStatusId);
      }
    } finally {
      isGenerating.value = false;
      if (statusId) viewerStore.removeStatus(statusId);
      if (simplificationStatusId) viewerStore.removeStatus(simplificationStatusId);
    }
  }

  // Watch for depth map changes (initial generation)
  watch(
    depthMap,
    async (newDepthMap) => {
      console.log(`📸 [Instance #${instanceId}] Depth map changed, generating mesh...`);
      await generateMesh(newDepthMap, meshConfig.value, true);
    },
    { immediate: true }
  );

  // Watch for parameter changes (regeneration without new depth map)
  // Exclude itemColor from triggering full regeneration
  // Use deep: true to only trigger when actual values change
  watch(
    () => {
      const { itemColor, ...rest } = meshConfig.value;
      return rest;
    },
    async (newConfig, oldConfig) => {
      if (!depthMap.value) return;

      // Skip the very first execution (depthMap watcher handles initial generation)
      if (skipFirstMeshConfigWatch) {
        skipFirstMeshConfigWatch = false;
        console.log(
          `⏭️  [Instance #${instanceId}] Skipping first meshConfig watch (initial generation handled by depthMap watcher)`
        );
        return;
      }

      console.log(`⚙️  [Instance #${instanceId}] Mesh config changed, regenerating...`);
      await generateMesh(depthMap.value, { ...newConfig, itemColor: meshConfig.value.itemColor }, false);
    },
    { deep: true }
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

  // Cleanup worker on unmount
  onUnmounted(() => {
    console.log(`🔧 useMeshGeneration instance #${instanceId} destroyed, terminating worker`);
    worker.terminate();
    disposeMesh(mesh.value);
  });

  return {
    mesh,
    isGenerating,
    generateMesh,
    disposeMesh,
  };
}
