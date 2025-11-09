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

  return {
    // State
    showGrid,
    gridSize,
    gridDivisions,

    // Actions
    setShowGrid,
    setGridSize,
    setGridDivisions,
  };
}
