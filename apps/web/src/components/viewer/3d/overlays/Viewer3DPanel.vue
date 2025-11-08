<template>
  <div class="viewer-3d-panel">
    <div class="panel-nav">
      <button
        class="nav-button"
        :class="{ active: activePanel === 'item' }"
        title="Item Tool"
        @click="activePanel = 'item'"
      >
        <font-awesome-icon icon="cube" />
      </button>
      <button
        class="nav-button"
        :class="{ active: activePanel === 'dimensions' }"
        title="Dimensions"
        @click="activePanel = 'dimensions'"
      >
        <font-awesome-icon icon="ruler-combined" />
      </button>
      <button class="nav-button" :class="{ active: activePanel === 'view' }" title="View" @click="activePanel = 'view'">
        <font-awesome-icon icon="eye" />
      </button>
    </div>
    <div class="panel-content">
      <!-- Item panel - Transform properties -->
      <ItemPanel v-if="activePanel === 'item'" :mesh="mesh" />

      <!-- Dimensions panel - Mesh dimensions -->
      <DimensionsPanel v-else-if="activePanel === 'dimensions'" />

      <!-- Placeholder for View panel -->
      <div v-else-if="activePanel === 'view'" class="panel-placeholder">
        <p>View panel coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import ItemPanel from "./panels/ItemPanel.vue";
import DimensionsPanel from "./panels/DimensionsPanel.vue";

const props = defineProps({
  mesh: {
    type: Object,
    default: null,
  },
});

// Active panel state
const activePanel = ref("item");
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
