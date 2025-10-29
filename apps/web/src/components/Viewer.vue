<template>
  <div class="viewer-wrapper">
    <h2>{{ imageStore.viewMode === "2d" ? "Depth Map" : "3D Preview" }}</h2>
    <div
      v-if="imageStore.depthMap"
      class="viewer-container"
      :class="{ 'drag-over': isDragging }"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- 2D Depth Map View -->
      <div v-show="imageStore.viewMode === '2d'" class="depth-map-view">
        <img ref="imageRef" :src="imageStore.depthMap" alt="Depth map preview" @load="onImageLoad" />
        <div v-if="imageDimensions" class="dimensions-badge">
          {{ imageDimensions.width }} × {{ imageDimensions.height }} px
        </div>
      </div>

      <!-- 3D STL View -->
      <div ref="viewerRef" class="viewer" v-show="imageStore.viewMode === '3d'"></div>

      <!-- View Mode Toggle Buttons -->
      <div class="view-mode-toggle">
        <button
          @click="imageStore.viewMode = '2d'"
          class="toggle-btn"
          :class="{ active: imageStore.viewMode === '2d' }"
          title="View depth map"
        >
          2D
        </button>
        <button
          @click="imageStore.viewMode = '3d'"
          class="toggle-btn"
          :class="{ active: imageStore.viewMode === '3d' }"
          title="View 3D model"
        >
          3D
        </button>
      </div>

      <!-- Loading Spinner - Subtle top right corner -->
      <div v-if="isGenerating && imageStore.viewMode === '3d'" class="loading-indicator">
        <font-awesome-icon icon="spinner" spin />
        <span>Generating...</span>
      </div>

      <div v-if="meshResolution && imageStore.viewMode === '3d'" class="mesh-dimensions-badge">
        {{ meshResolution.width }} × {{ meshResolution.height }} px
      </div>
      <div v-if="meshStats && imageStore.viewMode === '3d'" class="mesh-stats-badge">
        <div class="stat-line">{{ meshStats.vertices.toLocaleString() }} vertices</div>
        <div class="stat-line">{{ meshStats.memory }}</div>
      </div>
    </div>
    <div
      v-else
      class="viewer-placeholder"
      :class="{ 'drag-over': isDragging }"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="placeholder-icon">🎨</div>
      <p>No preview available</p>
      <p class="placeholder-hint">Load a depth map to see the preview</p>
      <p class="placeholder-hint">You can also drag & drop an image here</p>
    </div>
    <div v-if="imageStore.depthMap && imageStore.viewMode === '3d'" class="viewer-controls">
      <div class="view-buttons">
        <button @click="setTopView" class="btn btn-view">Top</button>
        <button @click="setBottomView" class="btn btn-view">Bottom</button>
        <button @click="setFrontView" class="btn btn-view">Front</button>
        <button @click="setBackView" class="btn btn-view">Back</button>
        <button @click="setLeftView" class="btn btn-view">Left</button>
        <button @click="setRightView" class="btn btn-view">Right</button>
        <button @click="setIsometricView" class="btn btn-view">Isometric</button>
        <button @click="resetView" class="btn btn-view btn-reset">Reset View</button>
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
import { ViewportGizmo } from "three-viewport-gizmo";
import { createMeshFromDepthMap, exportToSTL, download } from "../utils/stl";

const imageStore = useImageStore();
const viewerRef = ref(null);
const imageRef = ref(null);
const imageDimensions = ref(null);
const isPerspective = ref(true);
const lightIntensity = ref(2.0);
const meshResolution = ref(null);
const meshStats = ref(null);
const isGenerating = ref(false); // Track if mesh generation is in progress
const isDragging = ref(false); // Track drag & drop state

let scene, camera, perspectiveCamera, orthographicCamera, renderer, controls, currentMesh;
let ambientLight, directionalLight1, directionalLight2;
let gridHelper;
let viewportGizmo;
let isInitialized = false;
let isUpdating = false; // Track if update is in progress
let pendingUpdate = false; // Track if another update is needed

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);

  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  if (viewportGizmo) {
    viewportGizmo.dispose();
  }
});

// Watch for depth map changes - only these should reposition the camera
watch(
  () => imageStore.depthMap,
  async () => {
    if (imageStore.depthMap) {
      if (!isInitialized) {
        await nextTick();
        initThreeJS();
        isInitialized = true;
      }
      updatePreview({ repositionCamera: true });
    }
  },
  { immediate: true }
);

// Watch for all other parameter changes - preserve camera position
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
    if (imageStore.depthMap && isInitialized) {
      updatePreview({ repositionCamera: false });
    }
  }
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

  // Viewport Gizmo (orientation cube)
  console.log("Creating ViewportGizmo...", camera, renderer, viewerRef.value);
  viewportGizmo = new ViewportGizmo(camera, renderer, {
    container: viewerRef.value,
    size: 128,
    placement: "top-right",
  });
  console.log("ViewportGizmo created:", viewportGizmo);
  viewportGizmo.attachControls(controls);
  console.log("Controls attached to gizmo");

  // Handle window resize
  window.addEventListener("resize", handleResize);

  // Animation loop
  animate();
}

function handleResize() {
  if (!viewerRef.value || !renderer || !camera) return;

  const width = viewerRef.value.clientWidth;
  const height = viewerRef.value.clientHeight;

  renderer.setSize(width, height);

  if (isPerspective.value && perspectiveCamera) {
    perspectiveCamera.aspect = width / height;
    perspectiveCamera.updateProjectionMatrix();
  } else if (!isPerspective.value && orthographicCamera) {
    const aspect = width / height;
    const frustumSize = 200;
    orthographicCamera.left = (frustumSize * aspect) / -2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();
  }

  if (viewportGizmo) {
    viewportGizmo.update();
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Render main scene
  renderer.render(scene, camera);

  // Render viewport gizmo after main scene
  if (viewportGizmo) {
    viewportGizmo.render();
  }
}

async function updatePreview(options = {}) {
  const { repositionCamera = false } = options;

  // If already updating, mark that we need another update and return
  if (isUpdating) {
    pendingUpdate = true;
    console.log("⏭️ Update in progress - queuing next update");
    return;
  }

  isUpdating = true;
  isGenerating.value = true; // Show loading spinner

  try {
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
      enableContour: imageStore.enableContour,
      contourThreshold: imageStore.contourThreshold,
    };

    if (imageStore.simplificationRatio < 1.0) {
      console.log(
        `🔧 Applying decimation: ${imageStore.maxResolution}px → ${effectiveResolution}px (${(
          imageStore.simplificationRatio * 100
        ).toFixed(0)}%)`
      );
    }

    // Generate new mesh in background (old mesh stays visible)
    const newMesh = await createMeshFromDepthMap(imageStore.depthMap, config);

    // Calculate new mesh dimensions
    const box = new THREE.Box3().setFromObject(newMesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Now remove old mesh (after new one is ready)
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
    }

    // Add new mesh to scene
    currentMesh = newMesh;
    scene.add(newMesh);

    // Extract mesh resolution from userData
    if (newMesh.userData && newMesh.userData.resolution) {
      meshResolution.value = newMesh.userData.resolution;
    }

    // Calculate mesh statistics (vertex count and memory usage)
    if (newMesh.geometry) {
      const geometry = newMesh.geometry;
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

    // Only reposition camera when explicitly requested (new depth map loaded)
    if (repositionCamera) {
      console.log("📷 Repositioning camera (new depth map loaded)");
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
    } else {
      console.log("🔒 Preserving camera position");
      // Update controls target to new mesh center, but keep camera position
      controls.target.copy(center);
      controls.update();
    }
  } catch (error) {
    console.error("Error updating preview:", error);
  } finally {
    // Release the lock
    isUpdating = false;
    isGenerating.value = false; // Hide loading spinner

    // If another update was requested while we were updating, run it now
    if (pendingUpdate) {
      pendingUpdate = false;
      console.log("🔄 Running queued update");
      updatePreview();
    }
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

function resetView() {
  if (!currentMesh || !camera || !controls) return;

  console.log("🔄 Resetting view to default position");

  const box = new THREE.Box3().setFromObject(currentMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);

  // Dispose of the old controls to kill all momentum
  controls.dispose();

  // Reset to the same position as initial load
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

  // Recreate controls with fresh state
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.listenToKeyEvents(window);
  controls.target.copy(center);
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

  // Update viewport gizmo to track new camera
  if (viewportGizmo) {
    viewportGizmo.camera = camera;
  }

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
    };
    reader.readAsDataURL(file);
  }
}

function toggleTextureSource() {
  if (!currentMesh) return;

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

function onImageLoad() {
  if (imageRef.value) {
    const dimensions = {
      width: imageRef.value.naturalWidth,
      height: imageRef.value.naturalHeight,
    };
    imageDimensions.value = dimensions;
    imageStore.setImageDimensions(dimensions);
  }
}

// Drag & drop handlers
const handleDragEnter = (e) => {
  isDragging.value = true;
};

const handleDragOver = (e) => {
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  // Only set to false if we're leaving the container entirely
  if (e.target.classList.contains("viewer-container") || e.target.classList.contains("viewer-placeholder")) {
    isDragging.value = false;
  }
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  processFile(file);
};

const processFile = (file) => {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setDepthMap(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }
};

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

.depth-map-view {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.depth-map-view img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.viewer {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-grow: 1;
}

.view-mode-toggle {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  gap: 0.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toggle-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  background-color: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.toggle-btn.active {
  background-color: #3b82f6;
  color: white;
}

.dimensions-badge {
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
}

.loading-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: rgba(0, 0, 0, 0.7);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  font-size: 0.875rem;
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

.viewer-placeholder {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.viewer-placeholder .placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.viewer-placeholder p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 1.125rem;
}

.viewer-placeholder .placeholder-hint {
  font-size: 0.875rem !important;
  color: #adb5bd !important;
}

.drag-over {
  border-color: #0d6efd !important;
  background: linear-gradient(135deg, #e7f1ff 0%, #cfe2ff 100%) !important;
  transform: scale(1.01);
  transition: all 0.2s ease;
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

.btn-reset {
  background-color: #f59e0b;
}

.btn-reset:hover:not(:disabled) {
  background-color: #d97706;
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
