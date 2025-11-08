<template>
  <div class="viewer-3d-overlay">
    <!-- Blender-style layout (top-right corner):
         1. Gizmo at top
         2. Projection mode selector below gizmo
         3. Transform mode selector below projection
         4. Subtle toggle button at edge to reveal sidebar panel
         All controls slide left together when panel opens -->

    <!-- Controls container - slides left when panel opens -->
    <div v-if="showTransformControls" class="overlay-controls" :class="{ 'panel-open': isPanelOpen }">
      <!-- Viewport gizmo (managed via store context) -->
      <GizmoManager />

      <!-- Projection mode selector with camera reset -->
      <div class="overlay-projection-mode">
        <ProjectionModeSelector v-model="projectionMode" @reset-camera="resetCamera" />
      </div>

      <!-- Transform mode selector (below projection mode) -->
      <div class="overlay-transform-mode">
        <TransformModeSelector v-model="transformMode" />
      </div>
    </div>

    <!-- Sliding panel (revealed when toggle is clicked, aligned with gizmo at top) -->
    <div v-if="showTransformControls" class="overlay-panel" :class="{ 'panel-open': isPanelOpen }">
      <Viewer3DPanel :mesh="mesh" />
    </div>

    <!-- Subtle toggle button at far right edge (Blender-style) -->
    <div v-if="showTransformControls" class="overlay-toggle" :class="{ 'panel-open': isPanelOpen }">
      <button class="toggle-button" :title="isPanelOpen ? 'Hide Panel' : 'Show Panel'" @click="togglePanel">
        <font-awesome-icon :icon="isPanelOpen ? 'chevron-right' : 'chevron-left'" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useViewerStore } from "../../../../stores/viewer";
import GizmoManager from "../../shared/GizmoManager.vue";
import TransformModeSelector from "../controls/TransformModeSelector.vue";
import ProjectionModeSelector from "../controls/ProjectionModeSelector.vue";
import Viewer3DPanel from "./Viewer3DPanel.vue";

const viewerStore = useViewerStore();

const props = defineProps({
  showTransformControls: {
    type: Boolean,
    default: false,
  },
  mesh: {
    type: Object,
    default: null,
  },
});

const transformMode = defineModel("transformMode", {
  type: String,
  default: "translate",
});

const projectionMode = defineModel("projectionMode", {
  type: String,
  default: "perspective",
});

// Panel state
const isPanelOpen = ref(false);

function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value;
}

// Reset camera to initial position
function resetCamera() {
  const camera = viewerStore.camera;
  const controls = viewerStore.controls;

  if (!camera || !controls) return;

  // Reset to Blender default view position
  camera.position.set(150, -150, 150);

  // Reset controls target to origin
  controls.target.set(0, 0, 0);
  controls.update();
}

// Add body class when panel opens to control gizmo position
watch(isPanelOpen, (isOpen) => {
  if (isOpen) {
    document.body.classList.add("viewer-panel-open");
  } else {
    document.body.classList.remove("viewer-panel-open");
  }
});
</script>

<style scoped lang="scss">
@use "@/styles/layout/overlays.scss" as overlays;

.viewer-3d-overlay {
  // Pass-through container - no positioning
  pointer-events: none;
}

$panel-width: 300px;
$slide-offset: calc($panel-width + 16px); // Panel width + gap

// Controls container - groups all controls together for synchronized sliding
.overlay-controls {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
  transition: right 0.3s ease-in-out;

  &.panel-open {
    right: $slide-offset;
  }
}

.overlay-projection-mode {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 160px);
  right: var(--spacing-md);
  z-index: 100;
  transition: top 0.3s ease-in-out;
}

.overlay-transform-mode {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 225px);
  right: var(--spacing-md);
  z-index: 100;
  transition: top 0.3s ease-in-out;
}

// Subtle toggle button at far right edge (Blender-style)
// Positioned between gizmo and projection mode selector
.overlay-toggle {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 110px); // Between gizmo (144px end) and projection (160px start)
  right: 0; // At the very edge
  z-index: 101; // Above all controls
  transition: right 0.3s ease-in-out, top 0.3s ease-in-out;

  &.panel-open {
    right: $panel-width; // Align with panel edge
  }

  .toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px; // Wider for better visibility
    height: 36px; // Slightly shorter
    padding: 0;
    background: rgba(0, 0, 0, 0.3); // Subtle dark background
    border: none;
    border-radius: 4px 0 0 4px; // Rounded on left, flat on right
    cursor: pointer;
    pointer-events: auto;
    color: rgba(255, 255, 255, 0.7); // Light icon
    font-size: 10px; // Smaller icon
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.5);
      color: rgba(255, 255, 255, 1);
      width: 22px; // Slightly wider on hover
    }

    &:active {
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

// Panel aligned with gizmo at top
.overlay-panel {
  @include overlays.overlay-base;
  top: calc(var(--header-height, 0px) + 16px); // Align with gizmo
  right: -$panel-width; // Hidden off-screen by default
  width: $panel-width;
  height: calc(100vh - var(--header-height, 0px) - 32px);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease-in-out, top 0.3s ease-in-out, height 0.3s ease-in-out;
  z-index: 99; // Below controls
  overflow: hidden;

  &.panel-open {
    right: 0; // Flush with edge (no gap)
    border-radius: 8px 0 0 8px; // Only round left side when open
  }
}
</style>
