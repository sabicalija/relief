<template>
  <div class="viewer-3d-panel">
    <div class="panel-nav">
      <button
        class="nav-button"
        :class="{ active: activePanel === 'input' }"
        title="Input"
        @click="activePanel = 'input'"
      >
        <font-awesome-icon icon="image" />
      </button>
      <button class="nav-button" :class="{ active: activePanel === 'mesh' }" title="Mesh" @click="activePanel = 'mesh'">
        <font-awesome-icon icon="cube" />
      </button>
      <button
        class="nav-button"
        :class="{ active: activePanel === 'processing' }"
        title="Processing"
        @click="activePanel = 'processing'"
      >
        <font-awesome-icon icon="wand-magic-sparkles" />
      </button>
      <button
        class="nav-button"
        :class="{ active: activePanel === 'material' }"
        title="Material"
        @click="activePanel = 'material'"
      >
        <font-awesome-icon icon="palette" />
      </button>
      <button
        class="nav-button"
        :class="{ active: activePanel === 'quality' }"
        title="Quality"
        @click="activePanel = 'quality'"
      >
        <font-awesome-icon icon="sliders-h" />
      </button>
      <button class="nav-button" :class="{ active: activePanel === 'view' }" title="View" @click="activePanel = 'view'">
        <font-awesome-icon icon="eye" />
      </button>
    </div>
    <div class="panel-content">
      <!-- Input panel - Image metadata -->
      <InputPanel v-if="activePanel === 'input'" />

      <!-- Mesh panel - Transform and dimensions -->
      <MeshPanel v-else-if="activePanel === 'mesh'" :mesh="mesh" />

      <!-- Processing panel - Depth enhancement and contour flattening -->
      <ProcessingPanel v-else-if="activePanel === 'processing'" />

      <!-- Material panel - Color and texture -->
      <MaterialPanel v-else-if="activePanel === 'material'" />

      <!-- Quality panel - Simplification and stats -->
      <QualityPanel v-else-if="activePanel === 'quality'" :mesh="mesh" />

      <!-- View panel - Scene helpers and visibility -->
      <ViewPanel v-else-if="activePanel === 'view'" :mesh="mesh" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import InputPanel from "./panels/InputPanel.vue";
import MeshPanel from "./panels/MeshPanel.vue";
import ProcessingPanel from "./panels/ProcessingPanel.vue";
import MaterialPanel from "./panels/MaterialPanel.vue";
import QualityPanel from "./panels/QualityPanel.vue";
import ViewPanel from "./panels/ViewPanel.vue";

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

// Active panel state
const activePanel = ref("input");
</script>

<style scoped lang="scss">
.viewer-3d-panel {
  height: 100%;
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-primary, #333);
  font-size: 13px;
}

.panel-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.03);
  order: 2; // Place navigation on the right
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text-primary, #333);
  }

  &.active {
    background: #0066cc;
    border-color: #0066cc;
    color: white;

    &:hover {
      background: #0052a3;
      border-color: #0052a3;
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  order: 1; // Place content on the left
}

.panel-placeholder {
  padding: 32px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;

  p {
    margin: 0;
  }
}

// Custom scrollbar
.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>
