<template>
  <div v-if="imageStore.depthMap" class="viewer-wrapper">
    <h2>3D Preview</h2>
    <div class="viewer-container">
      <div ref="viewerRef" class="viewer"></div>
      <div v-if="meshResolution" class="mesh-dimensions-badge">
        {{ meshResolution.width }} × {{ meshResolution.height }} px
      </div>
      <div v-if="meshStats" class="mesh-stats-badge">
        <div class="stat-line">{{ meshStats.vertices.toLocaleString() }} vertices</div>
        <div class="stat-line">{{ meshStats.memory }}</div>
      </div>
    </div>
    <div class="viewer-controls">
      <div class="view-buttons">
        <button @click="setTopView" class="btn btn-view">Top</button>
        <button @click="setBottomView" class="btn btn-view">Bottom</button>
        <button @click="setFrontView" class="btn btn-view">Front</button>
        <button @click="setBackView" class="btn btn-view">Back</button>
        <button @click="setLeftView" class="btn btn-view">Left</button>
        <button @click="setRightView" class="btn btn-view">Right</button>
        <button @click="setIsometricView" class="btn btn-view">Isometric</button>
        <button @click="toggleProjection" class="btn btn-view btn-projection">
          {{ isPerspective ? "Perspective" : "Orthographic" }}
        </button>
      </div>
      <div class="light-control">
        <label for="light-intensity">Light Intensity</label>
        <input
          id="light-intensity"
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          v-model.number="lightIntensity"
          @input="updateLightIntensity"
        />
        <span class="light-value">{{ Number(lightIntensity).toFixed(1) }}</span>
      </div>
      <div class="texture-toggle">
        <label>
          <input type="checkbox" v-model="imageStore.showTexture" @change="toggleTexture" />
          <span>Show Texture</span>
        </label>
      </div>
      <div class="texture-toggle">
        <label>
          <input type="checkbox" v-model="imageStore.showGrid" @change="toggleGrid" />
          <span>Show Grid</span>
        </label>
      </div>
      <div class="texture-upload">
        <label for="texture-upload" class="upload-label">Upload Custom Texture</label>
        <input id="texture-upload" type="file" accept="image/*" @change="handleTextureUpload" class="file-input" />
        <button v-if="imageStore.textureMap" @click="clearTexture" class="btn btn-clear">Clear</button>
      </div>
      <div v-if="imageStore.textureMap" class="texture-source-toggle">
        <label>
          <input type="checkbox" v-model="imageStore.useCustomTexture" @change="toggleTextureSource" />
          <span>Use Custom Texture</span>
        </label>
      </div>
      <div class="color-control">
        <label for="base-color">Base Color</label>
        <input
          id="base-color"
          type="color"
          v-model="imageStore.baseColor"
          @input="updateBaseColor"
          class="color-input"
        />
      </div>
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
const isPerspective = ref(true);
const lightIntensity = ref(2.0);
const meshResolution = ref(null);
const meshStats = ref(null);

let scene, camera, perspectiveCamera, orthographicCamera, renderer, controls, currentMesh;
let ambientLight, directionalLight1, directionalLight2;
let gridHelper;
let isInitialized = false;
let isUpdating = false; // Prevent concurrent updatePreview calls

onUnmounted(() => {
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
});

// Watch for changes in depth map or parameters (except showTexture)
watch(
  () => [
    imageStore.depthMap,
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

  // Cameras
  const width = viewerRef.value.clientWidth || 800;
  const height = viewerRef.value.clientHeight || 500;
  const aspect = width / height;

  // Perspective camera
  perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
  perspectiveCamera.position.set(0, 100, 200);

  // Orthographic camera
  const frustumSize = 200;
  orthographicCamera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    10000
  );
  orthographicCamera.position.set(0, 100, 200);

  // Set active camera
  camera = perspectiveCamera;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  viewerRef.value.appendChild(renderer.domElement);

  // Lights
  ambientLight = new THREE.AmbientLight(0x606060, lightIntensity.value * 1.5);
  scene.add(ambientLight);

  directionalLight1 = new THREE.DirectionalLight(0xffffff, lightIntensity.value);
  directionalLight1.position.set(1, 1, 1);
  scene.add(directionalLight1);

  directionalLight2 = new THREE.DirectionalLight(0xffffff, lightIntensity.value * 0.5);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.listenToKeyEvents(window); // Enable arrow keys for rotation

  // Grid helper
  gridHelper = new THREE.GridHelper(200, 20);
  gridHelper.visible = imageStore.showGrid;
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
  // Prevent concurrent calls - return if already updating
  if (isUpdating) {
    console.log("⏭️ Skipping update - already in progress");
    return;
  }

  isUpdating = true;

  try {
    // Remove old mesh if exists
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();

      // Dispose materials (handle both single material and material array)
      if (Array.isArray(currentMesh.material)) {
        currentMesh.material.forEach((material) => {
          if (material.map) material.map.dispose();
          material.dispose();
        });
      } else {
        if (currentMesh.material.map) currentMesh.material.map.dispose();
        currentMesh.material.dispose();
      }
      currentMesh = null; // Clear reference
    }

    // Generate new mesh with decimation applied
    // Decimation works by reducing resolution: lower ratio = fewer vertices
    const effectiveResolution = Math.max(
      10, // Minimum 10px
      Math.floor(imageStore.maxResolution * imageStore.simplificationRatio)
    );

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
    };

    if (imageStore.simplificationRatio < 1.0) {
      console.log(
        `🔧 Applying decimation: ${imageStore.maxResolution}px → ${effectiveResolution}px (${(
          imageStore.simplificationRatio * 100
        ).toFixed(0)}%)`
      );
    }

    const mesh = await createMeshFromDepthMap(imageStore.depthMap, config);

    currentMesh = mesh;
    scene.add(mesh);

    // Extract mesh resolution from userData
    if (mesh.userData && mesh.userData.resolution) {
      meshResolution.value = mesh.userData.resolution;
    }

    // Calculate mesh statistics (vertex count and memory usage)
    if (mesh.geometry) {
      const geometry = mesh.geometry;
      const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;

      // Calculate memory usage
      // Position: 3 floats per vertex (12 bytes)
      // Normal: 3 floats per vertex (12 bytes)
      // UV: 2 floats per vertex (8 bytes)
      // Index: 1 uint32 per index (4 bytes)
      const positionBytes = vertexCount * 3 * 4; // 3 floats * 4 bytes
      const normalBytes = vertexCount * 3 * 4;
      const uvBytes = vertexCount * 2 * 4;
      const indexCount = geometry.index ? geometry.index.count : 0;
      const indexBytes = indexCount * 4; // uint32
      const totalBytes = positionBytes + normalBytes + uvBytes + indexBytes;

      // Format memory size
      let memoryStr;
      if (totalBytes < 1024) {
        memoryStr = `${totalBytes} B`;
      } else if (totalBytes < 1024 * 1024) {
        memoryStr = `${(totalBytes / 1024).toFixed(1)} KB`;
      } else {
        memoryStr = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
      }

      meshStats.value = {
        vertices: vertexCount,
        memory: memoryStr,
      };
    }

    // Center camera on mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);

    if (isPerspective.value) {
      const fov = perspectiveCamera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // Add some padding

      camera.position.set(center.x, center.y + cameraZ / 2, center.z + cameraZ);
    } else {
      // For orthographic camera, update frustum and position
      const distance = maxDim * 1.5;
      camera.position.set(center.x, center.y + distance / 2, center.z + distance);
      updateOrthographicFrustum(size, distance);
    }

    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  } catch (error) {
    console.error("Error updating preview:", error);
  } finally {
    // Always release the lock when done
    isUpdating = false;
  }
}

function updateOrthographicFrustum(size, distance) {
  if (!isPerspective.value && orthographicCamera) {
    const maxDim = Math.max(size.x, size.y, size.z);
    const frustumSize = maxDim * 1.2;
    const aspect = renderer.domElement.width / renderer.domElement.height;

    orthographicCamera.left = (frustumSize * aspect) / -2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();
  }
}

function setTopView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.z);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x, center.y + distance, center.z);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setBottomView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.z);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x, center.y - distance, center.z);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setFrontView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x, center.y, center.z + distance);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setBackView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x, center.y, center.z - distance);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setLeftView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.y, size.z);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x - distance, center.y, center.z);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setRightView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.y, size.z);
  const distance = isPerspective.value
    ? (maxDim / (2 * Math.tan((perspectiveCamera.fov * Math.PI) / 360))) * 1.5
    : maxDim * 1.5;

  camera.position.set(center.x + distance, center.y, center.z);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function setIsometricView() {
  if (!currentMesh || !camera || !controls) return;

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 1.5;

  // Isometric view: equal angles (roughly 45° on all axes)
  camera.position.set(center.x + distance, center.y + distance, center.z + distance);
  camera.lookAt(center);
  controls.target.copy(center);
  updateOrthographicFrustum(size, distance);
  controls.update();
}

function toggleProjection() {
  if (!perspectiveCamera || !orthographicCamera || !controls) return;

  // Store current camera state
  const oldCamera = camera;
  const position = oldCamera.position.clone();
  const target = controls.target.clone();

  // Switch camera
  isPerspective.value = !isPerspective.value;
  camera = isPerspective.value ? perspectiveCamera : orthographicCamera;

  // Transfer position and target to new camera
  camera.position.copy(position);
  camera.lookAt(target);

  // Update controls to use new camera
  controls.object = camera;
  controls.target.copy(target);
  controls.update();

  // If switching to orthographic, adjust zoom to match view
  if (!isPerspective.value && currentMesh) {
    const box = new THREE.Box3().setFromObject(currentMesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = camera.position.distanceTo(target);

    // Adjust orthographic camera frustum based on distance
    const frustumSize = maxDim * (distance / 100);
    const aspect = renderer.domElement.width / renderer.domElement.height;
    orthographicCamera.left = (frustumSize * aspect) / -2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();
  }
}

function updateLightIntensity() {
  if (!ambientLight || !directionalLight1 || !directionalLight2) return;

  const intensity = parseFloat(lightIntensity.value);
  ambientLight.intensity = intensity * 1.5;
  directionalLight1.intensity = intensity;
  directionalLight2.intensity = intensity * 0.5;
}

function toggleTexture() {
  if (!currentMesh) return;

  // Handle multi-material mesh
  if (Array.isArray(currentMesh.material)) {
    const topMaterial = currentMesh.material[0]; // Top surface material

    if (imageStore.showTexture) {
      // Dispose old texture if it exists
      if (topMaterial.map) {
        topMaterial.map.dispose();
      }

      // Load and apply texture
      const textureLoader = new THREE.TextureLoader();
      // Use custom texture if enabled and available, otherwise use depth map
      const textureSource =
        imageStore.useCustomTexture && imageStore.textureMap ? imageStore.textureMap : imageStore.depthMap;
      const texture = textureLoader.load(textureSource);
      texture.colorSpace = THREE.SRGBColorSpace;
      topMaterial.map = texture;
      topMaterial.color.set(0xffffff); // Reset to white for proper texture display
      topMaterial.needsUpdate = true;
    } else {
      // Remove texture and use base color for top surface too
      if (topMaterial.map) {
        topMaterial.map.dispose();
        topMaterial.map = null;
      }
      topMaterial.color.set(imageStore.baseColor);
      topMaterial.needsUpdate = true;
    }
  }
}

function toggleGrid() {
  if (!gridHelper) return;
  gridHelper.visible = imageStore.showGrid;
}

function handleTextureUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setTextureMap(e.target.result);
      // Automatically enable custom texture when uploaded
      imageStore.setUseCustomTexture(true);
    };
    reader.readAsDataURL(file);
  }
}

function clearTexture() {
  imageStore.setTextureMap(null);
  imageStore.setUseCustomTexture(false);
}

function toggleTextureSource() {
  // When switching texture source, dispose old texture and reload with new source
  if (!currentMesh) return;

  if (Array.isArray(currentMesh.material)) {
    const topMaterial = currentMesh.material[0];

    // Dispose old texture if it exists
    if (topMaterial.map) {
      topMaterial.map.dispose();
      topMaterial.map = null;
    }

    // If texture is enabled, load the new texture source
    if (imageStore.showTexture) {
      const textureLoader = new THREE.TextureLoader();
      const textureSource =
        imageStore.useCustomTexture && imageStore.textureMap ? imageStore.textureMap : imageStore.depthMap;
      const texture = textureLoader.load(textureSource);
      texture.colorSpace = THREE.SRGBColorSpace;
      topMaterial.map = texture;
      topMaterial.color.set(0xffffff);
      topMaterial.needsUpdate = true;
    }
  }
}

function updateBaseColor() {
  if (!currentMesh) return;

  // Update base material colors
  if (Array.isArray(currentMesh.material)) {
    // Always update material[1] (bottom and walls)
    if (currentMesh.material[1]) {
      currentMesh.material[1].color.set(imageStore.baseColor);
      currentMesh.material[1].needsUpdate = true;
    }

    // If texture is disabled, also update material[0] (top surface)
    if (!imageStore.showTexture && currentMesh.material[0]) {
      currentMesh.material[0].color.set(imageStore.baseColor);
      currentMesh.material[0].needsUpdate = true;
    }
  }
}

function downloadSTL() {
  if (!currentMesh) {
    alert("No mesh to export");
    return;
  }

  try {
    const blob = exportToSTL(currentMesh);

    // Generate descriptive filename based on depth map name and parameters
    let filename = "relief.stl";

    if (imageStore.depthMapFilename) {
      // Remove the file extension from the original filename
      const baseName = imageStore.depthMapFilename.replace(/\.[^/.]+$/, "");

      // Format parameters
      const depth = Math.round(imageStore.targetDepthMm);
      const thickness = Math.round(imageStore.baseThicknessMm);
      const resolution = imageStore.maxResolution;

      // Build filename: originalname_depth_thickness_resolution.stl
      // Example: susanne-und-mann_depth_anything_v2_grayscale_20mm_10mm_1024x.stl
      filename = `${baseName}_${depth}mm_${thickness}mm_${resolution}x.stl`;
    }

    download(blob, filename);
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

.viewer-container {
  position: relative;
  width: 100%;
}

.viewer {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-grow: 1;
}

.mesh-dimensions-badge {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgba(44, 62, 80, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  opacity: 1;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.viewer:hover + .mesh-dimensions-badge {
  opacity: 0.2;
}

.mesh-stats-badge {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background-color: rgba(44, 62, 80, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: "Courier New", monospace;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  opacity: 1;
  transition: opacity 0.3s ease;
  pointer-events: none;
  text-align: left;
}

.stat-line {
  line-height: 1.5;
}

.viewer:hover ~ .mesh-stats-badge {
  opacity: 0.2;
}

.viewer-controls {
  margin-top: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.view-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 100%;
}

.light-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.light-control label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
}

.light-control input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #d3d3d3;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.light-control input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
}

.light-control input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #42b983;
  cursor: pointer;
  border: none;
}

.light-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #42b983;
  min-width: 2rem;
  text-align: center;
}

.texture-toggle {
  display: flex;
  align-items: center;
  width: 100%;
}

.texture-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.texture-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #42b983;
}

.texture-toggle span {
  user-select: none;
}

.texture-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.upload-label {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.upload-label:hover {
  background: #5a6268;
}

.file-input {
  display: none;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: #dc2626;
  font-size: 0.85rem;
}

.btn-clear:hover:not(:disabled) {
  background: #b91c1c;
}

.texture-source-toggle {
  display: flex;
  align-items: center;
  width: 100%;
}

.texture-source-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #2c3e50;
}

.texture-source-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #42b983;
}

.texture-source-toggle span {
  user-select: none;
}

.color-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.color-control label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  white-space: nowrap;
}

.color-control .color-input {
  width: 50px;
  height: 32px;
  border: 2px solid #d3d3d3;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.3s;
}

.color-control .color-input:hover,
.color-control .color-input:focus {
  border-color: #42b983;
}

.btn {
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
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

.btn-view {
  background-color: #6c757d;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-view:hover:not(:disabled) {
  background-color: #5a6268;
}

.btn-projection {
  background-color: #17a2b8;
}

.btn-projection:hover:not(:disabled) {
  background-color: #138496;
}

.btn-download {
  background-color: #3498db;
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.btn-download:hover:not(:disabled) {
  background-color: #2980b9;
}
</style>
