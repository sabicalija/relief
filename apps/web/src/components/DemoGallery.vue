<template>
  <div class="demo-gallery">
    <h2>Try Demo Images</h2>
    <p class="subtitle">Click on any demo to load it instantly</p>
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
</template>

<script setup>
import { ref } from "vue";
import { useImageStore } from "../stores/image";

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
const activeDemo = ref(null);

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
    // Delegate fetching & setting to the store helper (fetches depth and optional texture)
    await imageStore.loadDepthMapFromUrl(demo.depthUrl, demo.originalUrl, `${demo.id}-depth.png`);
  } catch (error) {
    console.error("Error loading demo:", error);
  }
}
</script>

<style scoped lang="scss">
// No mixins needed, only uses CSS custom properties

.demo-gallery {
  margin-top: 4rem;
  padding: var(--spacing-xl);
  background: linear-gradient(to bottom, var(--color-bg), var(--color-bg-white));
  border-radius: var(--radius-xl);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 2rem;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.subtitle {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-md);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.demo-card {
  cursor: pointer;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-slow);
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.active {
    border: 3px solid var(--color-primary);
    box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);

    .demo-label {
      background: var(--color-primary);
      color: white;
    }
  }
}

.demo-image {
  width: 100%;
  height: 200px;
  object-fit: contain;
  display: block;
  background: var(--color-bg);
}

.demo-label {
  padding: 0.75rem;
  text-align: center;
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  background: var(--color-bg-white);
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }

  .demo-image {
    height: 150px;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
