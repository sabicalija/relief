<template>
  <div class="viewer-3d">
    <TresCanvas v-bind="canvasProps">
      <!-- Camera setup -->
      <CameraSetup
        ref="cameraSetupRef"
        :projection-mode="projectionMode"
        :camera-position="cameraPosition"
        :ortho-frustum="orthoFrustum"
      />

      <!-- Scene environment -->
      <SceneLighting />

      <!-- Debug helpers -->
      <SceneHelpers />

      <!-- 2D mode: Show depth map as textured plane -->
      <DepthMapPlane v-if="imageStore.viewMode === '2d'" />

      <!-- 3D mode: Show mesh editor with transform controls -->
      <MeshEditor
        v-if="imageStore.viewMode === '3d'"
        :mesh="mesh"
        :transform-mode="transformMode"
        :target-width-mm="imageStore.targetWidthMm"
        :target-height-mm="imageStore.targetHeightMm"
      />

      <!-- Viewport helpers -->
      <ViewportHelpers v-model:canvas-aspect="canvasAspect" />

      <!-- Sync Tres context to store (for external components) -->
      <ContextSync />
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
import { watch, ref, computed, nextTick } from "vue";
import { useImageStore } from "../../../stores/image";
import { useViewerStore } from "../../../stores/viewer";
import { useMeshGeneration } from "../../../composables/useMeshGeneration.js";
import CameraSetup from "./scene/CameraSetup.vue";
import SceneLighting from "./scene/SceneLighting.vue";
import SceneHelpers from "./scene/SceneHelpers.vue";
import DepthMapPlane from "./scene/DepthMapPlane.vue";
import MeshEditor from "./scene/MeshEditor.vue";
import ViewportHelpers from "./scene/ViewportHelpers.vue";
import ContextSync from "../shared/ContextSync.vue";
import Viewer3DOverlay from "./overlays/Viewer3DOverlay.vue";
import Viewer3DStatusIndicator from "./overlays/Viewer3DStatusIndicator.vue";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

// Transform and projection controls
const transformMode = ref(null); // Start with no transform mode active
const projectionMode = ref("perspective");

// Camera setup component ref
const cameraSetupRef = ref(null);

// Camera state preservation
const cameraPosition = ref([0, 150, 150]);

// Orthographic camera frustum (dynamically calculated based on aspect ratio)
// Match perspective camera's visible height at distance using FOV formula:
// visibleHeight = 2 * distance * tan(FOV/2)
// With FOV=50° and distance=150*sqrt(2)≈212, this gives ~100 for half-height
const orthoFrustumSize = 80; // Base size for height (matches perspective camera view)
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

// Mesh generation composable - generates once and caches
const { mesh } = useMeshGeneration({
  depthMap: computed(() => imageStore.depthMap),
  meshConfig: computed(() => imageStore.meshGenerationConfig),
  statusStore: viewerStore,
});

// Control mesh visibility based on view mode (instant switch)
watch(
  [mesh, () => imageStore.viewMode],
  ([meshValue, viewMode]) => {
    if (meshValue) {
      meshValue.visible = viewMode === "3d";
    }
  },
  { immediate: true }
);

// Canvas configuration (static)
const canvasProps = {
  clearColor: "#f0f0f0",
  antialias: true,
  alpha: false,
};

// Watch for projection mode changes and save camera state
watch(projectionMode, async (newMode, oldMode) => {
  // Save current camera position before switch
  if (cameraSetupRef.value) {
    const refKey = oldMode === "perspective" ? "perspectiveCameraRef" : "orthographicCameraRef";
    const currentCameraRef = cameraSetupRef.value[refKey];

    if (currentCameraRef) {
      const cam = currentCameraRef;
      cameraPosition.value = [cam.position.x, cam.position.y, cam.position.z];
    }
  }

  // Trigger aspect ratio recalculation after camera switch
  await nextTick();
  // Force a small update to trigger aspect recalculation
  canvasAspect.value = canvasAspect.value || 1;
});
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
