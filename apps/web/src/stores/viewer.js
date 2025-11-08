import { defineStore } from "pinia";
import { createViewerContext } from "./viewer/context.js";
import { createViewerStatus } from "./viewer/status.js";

/**
 * Viewer store - manages 3D viewer context and status
 * Modular structure with separate concerns for better maintainability
 */
export const useViewerStore = defineStore("viewer", () => {
  // Create context module (TresJS context and render loops)
  const context = createViewerContext();

  // Create status module (status messages and indicators)
  const status = createViewerStatus();

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
  };
});
