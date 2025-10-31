<template>
  <div class="viewer-3d">
    <TresCanvas v-bind="canvasProps">
      <TresPerspectiveCamera
        v-if="projectionMode === 'perspective'"
        ref="perspectiveCameraRef"
        :position="cameraPosition"
        :make-default="true"
      />
      <TresOrthographicCamera
        v-if="projectionMode === 'orthographic'"
        ref="orthographicCameraRef"
        :position="cameraPosition"
        :left="orthoFrustum.left"
        :right="orthoFrustum.right"
        :top="orthoFrustum.top"
        :bottom="orthoFrustum.bottom"
        :near="0.1"
        :far="2000"
        :make-default="true"
      />
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

      <!-- Camera aspect ratio sync -->
      <CameraAspectSync v-model:canvas-aspect="canvasAspect" />
    </TresCanvas>

    <!-- Transform controls overlay (top-left) -->
    <Viewer3DOverlay
      :show-transform-controls="!!mesh"
      v-model:transform-mode="transformMode"
      v-model:projection-mode="projectionMode"
    />

    <!-- Status indicator (bottom-left) -->
    <Viewer3DStatusIndicator />
  </div>
</template>

<script setup>
import { TresCanvas } from "@tresjs/core";
import { OrbitControls, TransformControls } from "@tresjs/cientos";
import { reactive, watch, ref, markRaw, computed, nextTick } from "vue";
import { useImageStore } from "../../stores/image";
import { useViewerStatusStore } from "../../stores/viewerStatus";
import { createMeshFromDepthMap } from "../../utils/mesh/index.js";
import Viewer3DOverlay from "./Viewer3DOverlay.vue";
import Viewer3DStatusIndicator from "./Viewer3DStatusIndicator.vue";
import MeshMeasurements from "./3d/MeshMeasurements.vue";
import GizmoSetup from "./GizmoSetup.vue";
import CameraAspectSync from "./CameraAspectSync.vue";

const imageStore = useImageStore();
const statusStore = useViewerStatusStore();
const mesh = ref(null);
const isGenerating = ref(false);
const transformMode = ref("translate");
const projectionMode = ref("perspective");
const perspectiveCameraRef = ref(null);
const orthographicCameraRef = ref(null);
const orbitControlsRef = ref(null);

// Camera state preservation
const cameraPosition = ref([0, 150, 150]);
const cameraQuaternion = ref(null);

// Orthographic camera frustum (dynamically calculated based on aspect ratio)
const orthoFrustumSize = 150; // Base size for height
const canvasAspect = ref(1); // Will be updated based on canvas dimensions
const orthoFrustum = computed(() => {
  const aspect = canvasAspect.value;
  return {
    left: -orthoFrustumSize * aspect,
    right: orthoFrustumSize * aspect,
    top: orthoFrustumSize,
    bottom: -orthoFrustumSize,
  };
});

// Canvas configuration
const canvasProps = reactive({
  clearColor: "#f0f0f0",
  antialias: true,
  alpha: false,
});

// Watch for projection mode changes and save camera state
watch(projectionMode, async (newMode, oldMode) => {
  // Save current camera position and rotation before switch
  const currentCameraRef = oldMode === "perspective" ? perspectiveCameraRef : orthographicCameraRef;
  if (currentCameraRef.value) {
    const cam = currentCameraRef.value;
    cameraPosition.value = [cam.position.x, cam.position.y, cam.position.z];
  }

  // Trigger aspect ratio recalculation after camera switch
  await nextTick();
  // Force a small update to trigger aspect recalculation
  canvasAspect.value = canvasAspect.value || 1;
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
