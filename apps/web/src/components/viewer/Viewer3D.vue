<template>
  <div class="viewer-3d">
    <TresCanvas v-bind="canvasProps">
      <TresPerspectiveCamera :position="[0, 150, 150]" :make-default="true" />
      <OrbitControls ref="orbitControlsRef" make-default />

      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight :position="[1, 1, 1]" :intensity="1" />

      <!-- Debug helpers -->
      <TresGridHelper :args="[200, 20]" />
      <!-- <TresAxesHelper :args="[50]" /> -->

      <!-- Render mesh when available -->
      <primitive v-if="mesh" :object="mesh" />

      <!-- Transform controls for manipulating the mesh (only when mode is active) -->
      <TransformControls v-if="mesh && transformMode" ref="transformControlsRef" :object="mesh" :mode="transformMode" />

      <!-- Measurement indicators -->
      <MeshMeasurements
        v-if="mesh"
        :mesh="mesh"
        :target-width-mm="imageStore.targetWidthMm"
        :target-height-mm="imageStore.targetHeightMm"
      />

      <!-- Gizmo setup component -->
      <GizmoSetup />
    </TresCanvas>

    <!-- Transform controls overlay (top-left) -->
    <Viewer3DOverlay :show-transform-controls="!!mesh" v-model:transform-mode="transformMode" />

    <!-- Status indicator (bottom-left) -->
    <Viewer3DStatusIndicator />
  </div>
</template>

<script setup>
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, TransformControls } from "@tresjs/cientos";
import { reactive, watch, ref, markRaw } from "vue";
import { useImageStore } from "../../stores/image";
import { useViewerStatusStore } from "../../stores/viewerStatus";
import { createMeshFromDepthMap } from "../../utils/mesh/index.js";
import Viewer3DOverlay from "./Viewer3DOverlay.vue";
import Viewer3DStatusIndicator from "./Viewer3DStatusIndicator.vue";
import MeshMeasurements from "./3d/MeshMeasurements.vue";
import GizmoSetup from "./GizmoSetup.vue";

const imageStore = useImageStore();
const statusStore = useViewerStatusStore();
const mesh = ref(null);
const isGenerating = ref(false);
const transformMode = ref("translate");

// Canvas configuration
const canvasProps = reactive({
  clearColor: "#f0f0f0",
  antialias: true,
  alpha: false,
});

// Watch for depth map changes
watch(
  () => imageStore.depthMap,
  async (newDepthMap) => {
    if (!newDepthMap) {
      mesh.value = null;
      return;
    }

    isGenerating.value = true;
    const statusId = statusStore.showGenerating("Generating 3D mesh...");
    console.log("🔄 Generating mesh from depth map...");

    try {
      const effectiveResolution = Math.max(10, Math.floor(imageStore.maxResolution * imageStore.simplificationRatio));

      // Ensure minimum display time for status message
      const [newMesh] = await Promise.all([
        createMeshFromDepthMap(newDepthMap, {
          targetDepthMm: imageStore.targetDepthMm,
          baseThicknessMm: imageStore.baseThicknessMm,
          targetWidthMm: imageStore.targetWidthMm,
          targetHeightMm: imageStore.targetHeightMm,
          maxResolution: effectiveResolution,
          showTexture: imageStore.showTexture,
          textureMap: imageStore.useCustomTexture && imageStore.textureMap ? imageStore.textureMap : null,
          baseColor: imageStore.baseColor,
          enhanceDetails: imageStore.enhanceDetails,
          detailEnhancementStrength: imageStore.detailEnhancementStrength,
          detailThreshold: imageStore.detailThreshold,
          preserveMajorFeatures: imageStore.preserveMajorFeatures,
          smoothingKernelSize: imageStore.smoothingKernelSize,
          enableContour: imageStore.enableContour,
          contourThreshold: imageStore.contourThreshold,
        }),
        new Promise((resolve) => setTimeout(resolve, 300)), // Minimum 300ms display
      ]);

      // Dispose old mesh completely
      if (mesh.value) {
        // Remove from scene
        if (mesh.value.parent) {
          mesh.value.parent.remove(mesh.value);
        }

        // Dispose geometry
        if (mesh.value.geometry) {
          mesh.value.geometry.dispose();
        }

        // Dispose materials and textures
        if (mesh.value.material) {
          const materials = Array.isArray(mesh.value.material) ? mesh.value.material : [mesh.value.material];
          materials.forEach((m) => {
            // Dispose all textures
            if (m.map) {
              m.map.dispose();
            }
            if (m.normalMap) {
              m.normalMap.dispose();
            }
            if (m.roughnessMap) {
              m.roughnessMap.dispose();
            }
            if (m.metalnessMap) {
              m.metalnessMap.dispose();
            }
            // Dispose material
            m.dispose();
          });
        }
      }

      // Use markRaw to prevent Vue from making Three.js objects reactive
      mesh.value = markRaw(newMesh);
      console.log("✅ Mesh generated successfully");
      statusStore.removeStatus(statusId);
      statusStore.showSuccess("Mesh generated successfully", 2000);
    } catch (error) {
      console.error("❌ Error generating mesh:", error);
      statusStore.removeStatus(statusId);
      statusStore.showError(`Error generating mesh: ${error.message}`, 5000);
    } finally {
      isGenerating.value = false;
    }
  },
  { immediate: true }
);

// Watch for parameter changes (without depth map)
watch(
  () => [
    imageStore.textureMap,
    imageStore.useCustomTexture,
    imageStore.targetDepthMm,
    imageStore.baseThicknessMm,
    imageStore.targetWidthMm,
    imageStore.targetHeightMm,
    imageStore.maxResolution,
    imageStore.simplificationRatio,
    imageStore.enhanceDetails,
    imageStore.detailEnhancementStrength,
    imageStore.detailThreshold,
    imageStore.preserveMajorFeatures,
    imageStore.smoothingKernelSize,
    imageStore.enableContour,
    imageStore.contourThreshold,
  ],
  async () => {
    if (!imageStore.depthMap) return;

    isGenerating.value = true;
    console.log("🔄 Regenerating mesh due to parameter change...");

    try {
      const effectiveResolution = Math.max(10, Math.floor(imageStore.maxResolution * imageStore.simplificationRatio));

      const config = {
        targetDepthMm: imageStore.targetDepthMm,
        baseThicknessMm: imageStore.baseThicknessMm,
        targetWidthMm: imageStore.targetWidthMm,
        targetHeightMm: imageStore.targetHeightMm,
        maxResolution: effectiveResolution,
        showTexture: imageStore.showTexture,
        textureMap: imageStore.useCustomTexture && imageStore.textureMap ? imageStore.textureMap : null,
        baseColor: imageStore.baseColor,
        enhanceDetails: imageStore.enhanceDetails,
        detailEnhancementStrength: imageStore.detailEnhancementStrength,
        detailThreshold: imageStore.detailThreshold,
        preserveMajorFeatures: imageStore.preserveMajorFeatures,
        smoothingKernelSize: imageStore.smoothingKernelSize,
        enableContour: imageStore.enableContour,
        contourThreshold: imageStore.contourThreshold,
      };

      const newMesh = await createMeshFromDepthMap(imageStore.depthMap, config);

      // Dispose old mesh completely
      if (mesh.value) {
        // Remove from scene
        if (mesh.value.parent) {
          mesh.value.parent.remove(mesh.value);
        }

        // Dispose geometry
        if (mesh.value.geometry) {
          mesh.value.geometry.dispose();
        }

        // Dispose materials and textures
        if (mesh.value.material) {
          const materials = Array.isArray(mesh.value.material) ? mesh.value.material : [mesh.value.material];
          materials.forEach((m) => {
            // Dispose all textures
            if (m.map) {
              m.map.dispose();
            }
            if (m.normalMap) {
              m.normalMap.dispose();
            }
            if (m.roughnessMap) {
              m.roughnessMap.dispose();
            }
            if (m.metalnessMap) {
              m.metalnessMap.dispose();
            }
            // Dispose material
            m.dispose();
          });
        }
      }

      // Use markRaw to prevent Vue from making Three.js objects reactive
      mesh.value = markRaw(newMesh);
      console.log("✅ Mesh regenerated successfully");
    } catch (error) {
      console.error("❌ Error regenerating mesh:", error);
    } finally {
      isGenerating.value = false;
    }
  }
);
</script>

<style scoped>
.viewer-3d {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
  padding: 0.5rem;
}
</style>
