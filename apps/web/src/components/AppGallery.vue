<template>
  <div class="gallery-wrapper" :class="{ collapsed: isCollapsed }" ref="galleryWrapperRef">
    <div class="demo-gallery">
      <h2>Try Demo Images</h2>
      <div class="gallery-grid">
        <div
          v-for="demo in demos"
          :key="demo.id"
          class="demo-card"
          @click="loadDemo(demo)"
          :class="{ active: activeDemo === demo.id }"
        >
          <img :src="demo.depthUrl" :alt="demo.name" class="demo-image" />
          <div class="demo-label">{{ demo.name }}</div>
        </div>
      </div>
    </div>
    <button
      class="toggle-button"
      :class="{ collapsed: isCollapsed }"
      @click="isCollapsed = !isCollapsed"
      title="Toggle gallery"
    >
      <font-awesome-icon :icon="['fas', isCollapsed ? 'angles-up' : 'angles-down']" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useImageStore } from "../stores/image";
import { useViewerStore } from "../stores/viewer";

// Import all demo images
import demo01 from "../assets/images/demo/demo01.png";
import demo01Depth from "../assets/images/demo/demo01-depth.png";

import demo02 from "../assets/images/demo/demo02.png";
import demo02Depth from "../assets/images/demo/demo02-depth.png";

import demo03 from "../assets/images/demo/demo03.png";
import demo03Depth from "../assets/images/demo/demo03-depth.png";

import demo04 from "../assets/images/demo/demo04.png";
import demo04Depth from "../assets/images/demo/demo04-depth.png";

import demo05 from "../assets/images/demo/demo05.png";
import demo05Depth from "../assets/images/demo/demo05-depth.png";

import demo06 from "../assets/images/demo/demo06.jpg";
import demo06Depth from "../assets/images/demo/demo06-depth.png";

const imageStore = useImageStore();
const viewerStore = useViewerStore();
const activeDemo = ref(null);
const isCollapsed = ref(false);
const galleryWrapperRef = ref(null);

const demos = [
  {
    id: "demo01",
    name: "Demo 1",
    originalUrl: demo01,
    depthUrl: demo01Depth,
  },
  {
    id: "demo02",
    name: "Demo 2",
    originalUrl: demo02,
    depthUrl: demo02Depth,
  },
  {
    id: "demo03",
    name: "Demo 3",
    originalUrl: demo03,
    depthUrl: demo03Depth,
  },
  {
    id: "demo04",
    name: "Demo 4",
    originalUrl: demo04,
    depthUrl: demo04Depth,
  },
  {
    id: "demo05",
    name: "Demo 5",
    originalUrl: demo05,
    depthUrl: demo05Depth,
  },
  {
    id: "demo06",
    name: "Demo 6",
    originalUrl: demo06,
    depthUrl: demo06Depth,
  },
];

async function loadDemo(demo) {
  activeDemo.value = demo.id;
  try {
    await imageStore.loadDepthMapFromUrl(demo.depthUrl, demo.originalUrl, `${demo.id}-depth.png`);
  } catch (error) {
    console.error("Error loading demo:", error);
  }
}

// Watch for mesh generation completion and auto-collapse
// The status store shows "Mesh generated successfully" when done
watch(
  () => viewerStore.currentStatus,
  (newStatus) => {
    if (newStatus && newStatus.message === "Mesh generated successfully" && activeDemo.value) {
      // Collapse after mesh generation completes
      isCollapsed.value = true;
    }
  }
);

// Update CSS variable for gallery height
function updateGalleryHeight() {
  if (galleryWrapperRef.value) {
    const height = isCollapsed.value ? 0 : galleryWrapperRef.value.offsetHeight;
    document.documentElement.style.setProperty("--gallery-height", `${height}px`);
  }
}

// Watch for collapse state changes and update CSS variable
watch(
  isCollapsed,
  () => {
    updateGalleryHeight();
  },
  { flush: "post" }
);

onMounted(() => {
  updateGalleryHeight();
  // Update on window resize
  window.addEventListener("resize", updateGalleryHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateGalleryHeight);
  document.documentElement.style.setProperty("--gallery-height", "0px");
});
</script>

<style scoped>
.gallery-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);
}

.gallery-wrapper.collapsed {
  transform: translateY(100%);
}

.demo-gallery {
  padding: 1rem 2rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  max-height: 40vh;
  overflow-y: auto;
}

h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  pointer-events: auto;
}

.demo-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  position: relative;
}

.demo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.demo-card.active {
  border: 3px solid #42b983;
  box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);
}

.demo-card.active .demo-label {
  background: #42b983;
  color: white;
}

.demo-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
  background: #f0f0f0;
}

.demo-label {
  padding: 0.5rem;
  text-align: center;
  font-weight: 500;
  color: #2c3e50;
  background: #ffffff;
  font-size: 0.875rem;
}

.toggle-button {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  pointer-events: auto;
  color: #6c757d;
  font-size: 1rem;
  transition: color 0.2s, background 0.2s;
  z-index: 101;
}

.toggle-button:hover {
  color: #42b983;
  background: rgba(255, 255, 255, 1);
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .demo-image {
    height: 100px;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
