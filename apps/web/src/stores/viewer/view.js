import { ref } from "vue";

/**
 * Viewer view settings module
 * Manages visibility and configuration of scene helpers (grid, axes, etc.)
 */
export function createViewerView() {
  // Grid visibility
  const showGrid = ref(true);

  // Grid dimensions [size, divisions] - null means auto-calculate
  const gridSize = ref(null);
  const gridDivisions = ref(null);

  // Scene background color
  const backgroundColor = ref("#f0f0f0");

  // Lighting configuration
  const ambientLightIntensity = ref(1.5);
  const directionalLightIntensity = ref(1.0);

  // Actions
  function setShowGrid(value) {
    showGrid.value = value;
  }

  function setGridSize(value) {
    gridSize.value = value;
  }

  function setGridDivisions(value) {
    gridDivisions.value = value;
  }

  function setBackgroundColor(value) {
    backgroundColor.value = value;
  }

  function setAmbientLightIntensity(value) {
    ambientLightIntensity.value = value;
  }

  function setDirectionalLightIntensity(value) {
    directionalLightIntensity.value = value;
  }

  return {
    // State
    showGrid,
    gridSize,
    gridDivisions,
    backgroundColor,
    ambientLightIntensity,
    directionalLightIntensity,

    // Actions
    setShowGrid,
    setGridSize,
    setGridDivisions,
    setBackgroundColor,
    setAmbientLightIntensity,
    setDirectionalLightIntensity,
  };
}
