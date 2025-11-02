import { ref } from "vue";

/**
 * Viewer context module
 * Manages Three.js/TresJS context (camera, renderer, controls) and render loop callbacks
 */
export function createViewerContext() {
  // Three.js context refs
  const camera = ref(null);
  const renderer = ref(null);
  const controls = ref(null);

  // Render callbacks for external components (e.g., gizmo)
  const renderCallbacks = ref(new Set());

  /**
   * Set camera reference from TresJS context
   */
  function setCamera(cam) {
    camera.value = cam;
  }

  /**
   * Set renderer reference from TresJS context
   */
  function setRenderer(rend) {
    renderer.value = rend;
  }

  /**
   * Set controls reference from TresJS context
   */
  function setControls(ctrl) {
    controls.value = ctrl;
  }

  /**
   * Register a callback to be called on each render frame
   * @param {Function} callback - Function to call on each frame
   * @returns {Function} Unregister function
   */
  function registerRenderCallback(callback) {
    renderCallbacks.value.add(callback);
    return () => renderCallbacks.value.delete(callback);
  }

  /**
   * Execute all registered render callbacks
   * Called from ContextSync component on each frame
   */
  function executeRenderCallbacks() {
    renderCallbacks.value.forEach((callback) => callback());
  }

  /**
   * Clear all context references (cleanup on unmount)
   */
  function clear() {
    camera.value = null;
    renderer.value = null;
    controls.value = null;
    renderCallbacks.value.clear();
  }

  return {
    // State
    camera,
    renderer,
    controls,
    // Actions
    setCamera,
    setRenderer,
    setControls,
    registerRenderCallback,
    executeRenderCallbacks,
    clear,
  };
}
