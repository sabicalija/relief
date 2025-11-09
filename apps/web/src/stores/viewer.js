import { defineStore } from "pinia";
import { createViewerContext } from "./viewer/context.js";
import { createViewerStatus } from "./viewer/status.js";
import { createViewerView } from "./viewer/view.js";

/**
 * Viewer store - manages 3D viewer context and status
 * Modular structure with separate concerns for better maintainability
 */
export const useViewerStore = defineStore("viewer", () => {
  // Create context module (TresJS context and render loops)
  const context = createViewerContext();

  // Create status module (status messages and indicators)
  const status = createViewerStatus();

  // Create view module (scene helpers visibility and configuration)
  const view = createViewerView();

  // Return flattened API (backward compatible with existing components)
  return {
    // Context state
    camera: context.camera,
    renderer: context.renderer,
    controls: context.controls,

    // Context actions
    setCamera: context.setCamera,
    setRenderer: context.setRenderer,
    setControls: context.setControls,
    registerRenderCallback: context.registerRenderCallback,
    executeRenderCallbacks: context.executeRenderCallbacks,
    clearContext: context.clear,

    // Status state
    statusQueue: status.statusQueue,
    currentStatus: status.currentStatus,
    activeDimensionMeasurement: status.activeDimensionMeasurement,

    // Status actions
    addStatus: status.addStatus,
    removeStatus: status.removeStatus,
    clearAllStatus: status.clearAll,
    setActiveDimensionMeasurement: status.setActiveDimensionMeasurement,

    // Status helpers
    showGenerating: status.showGenerating,
    showSuccess: status.showSuccess,
    showError: status.showError,

    // View state
    showGrid: view.showGrid,
    gridSize: view.gridSize,
    gridDivisions: view.gridDivisions,
    backgroundColor: view.backgroundColor,

    // View actions
    setShowGrid: view.setShowGrid,
    setGridSize: view.setGridSize,
    setGridDivisions: view.setGridDivisions,
    setBackgroundColor: view.setBackgroundColor,
  };
});
