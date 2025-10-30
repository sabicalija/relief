<template>
  <div class="viewer-3d">
    <TresCanvas v-bind="canvasProps">
      <TresPerspectiveCamera :position="[0, 150, 150]" :make-default="true" />
      <CameraControls />

      <TresAmbientLight :intensity="1.5" />
      <TresDirectionalLight :position="[1, 1, 1]" :intensity="1" />

      <!-- Debug helpers -->
      <TresGridHelper :args="[200, 20]" />
      <!-- <TresAxesHelper :args="[50]" /> -->

      <!-- Render mesh when available -->
      <primitive v-if="mesh" :object="mesh" />

      <!-- Gizmo setup component -->
      <GizmoSetup />
    </TresCanvas>

    <!-- Loading overlay -->
    <Viewer3DOverlay :is-generating="isGenerating" />
  </div>
</template>

<script setup>
import { TresCanvas } from "@tresjs/core";
import { CameraControls } from "@tresjs/cientos";
import { reactive, watch, ref, markRaw } from "vue";
import { useImageStore } from "../../stores/image";
import { createMeshFromDepthMap } from "../../utils/mesh/index.js";
import Viewer3DOverlay from "./Viewer3DOverlay.vue";
import GizmoSetup from "./GizmoSetup.vue";

const imageStore = useImageStore();
const mesh = ref(null);
const isGenerating = ref(false);

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
    console.log("🔄 Generating mesh from depth map...");

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

      const newMesh = await createMeshFromDepthMap(newDepthMap, config);

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
    } catch (error) {
      console.error("❌ Error generating mesh:", error);
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
