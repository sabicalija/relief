<template>
  <div v-if="imageStore.depthMap" class="viewer-wrapper">
    <h2>3D Preview</h2>
    <div ref="viewerRef" class="viewer"></div>
    <div class="viewer-controls">
      <button @click="downloadSTL" class="btn btn-download">Download STL</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, watch, nextTick } from "vue";
import { useImageStore } from "../stores/image";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMeshFromDepthMap, exportToSTL, download } from "../utils/stl";

const imageStore = useImageStore();
const viewerRef = ref(null);

let scene, camera, renderer, controls, currentMesh;
let isInitialized = false;

onUnmounted(() => {
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});

// Watch for changes in depth map or parameters
watch(
  () => [
    imageStore.depthMap,
    imageStore.targetDepthMm,
    imageStore.baseThicknessMm,
    imageStore.targetWidthMm,
    imageStore.targetHeightMm,
  ],
  async () => {
    if (imageStore.depthMap) {
      if (!isInitialized) {
        await nextTick();
        initThreeJS();
        isInitialized = true;
      }
      updatePreview();
    }
  },
  { immediate: true }
);

function initThreeJS() {
  if (!viewerRef.value) {
    console.error("Viewer ref not available");
    return;
  }

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera
  const width = viewerRef.value.clientWidth || 800;
  const height = viewerRef.value.clientHeight || 500;
  const aspect = width / height;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
  camera.position.set(0, 100, 200);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  viewerRef.value.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Grid helper
  const gridHelper = new THREE.GridHelper(200, 20);
  scene.add(gridHelper);

  // Animation loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function updatePreview() {
  try {
    // Remove old mesh if exists
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }

    // Generate new mesh
    const config = {
      targetDepthMm: imageStore.targetDepthMm,
      baseThicknessMm: imageStore.baseThicknessMm,
      targetWidthMm: imageStore.targetWidthMm,
      targetHeightMm: imageStore.targetHeightMm,
    };

    const mesh = await createMeshFromDepthMap(imageStore.depthMap, config);
    currentMesh = mesh;
    scene.add(mesh);

    // Center camera on mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Add some padding

    camera.position.set(center.x, center.y + cameraZ / 2, center.z + cameraZ);
    camera.lookAt(center);
    controls.target.copy(center);
  } catch (error) {
    console.error("Error updating preview:", error);
  }
}

function downloadSTL() {
  if (!currentMesh) {
    alert("No mesh to export");
    return;
  }

  try {
    const blob = exportToSTL(currentMesh);
    download(blob, "relief.stl");
  } catch (error) {
    console.error("Error exporting STL:", error);
    alert("Failed to export STL file");
  }
}
</script>

<style scoped>
.viewer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.viewer-wrapper h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  margin-top: 0;
  text-align: left;
}

.viewer {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-grow: 1;
}

.viewer-controls {
  margin-top: 1rem;
  text-align: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover:not(:disabled) {
  background-color: #359268;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-download {
  background-color: #3498db;
}

.btn-download:hover:not(:disabled) {
  background-color: #2980b9;
}
</style>
