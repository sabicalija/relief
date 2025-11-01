import { defineStore } from "pinia";
import { createImageState } from "./image/state.js";
import { createGetters } from "./image/getters.js";
import { createLoaders } from "./image/loaders.js";
import { createDimensionSetters } from "./image/dimensions.js";
import { createMeshSetters } from "./image/mesh.js";
import { createEnhancementSetters } from "./image/enhancements.js";
import { createContourSetters } from "./image/contour.js";
import { createDisplaySetters } from "./image/display.js";

/**
 * Image store - manages depth maps, textures, and mesh configuration
 * Modular structure with separate concerns for better maintainability
 */
export const useImageStore = defineStore("image", () => {
  // Create all state refs
  const state = createImageState();

  // Create getters (computed values derived from state)
  const getters = createGetters(state);

  // Create all action groups (pass state refs they need)
  const loaders = createLoaders(state);
  const dimensions = createDimensionSetters(state);
  const mesh = createMeshSetters(state);
  const enhancements = createEnhancementSetters(state);
  const contour = createContourSetters(state);
  const display = createDisplaySetters(state);

  // Return flattened API (backward compatible with existing components)
  return {
    // State
    ...state,
    // Getters
    ...getters,
    // Actions
    ...loaders,
    ...dimensions,
    ...mesh,
    ...enhancements,
    ...contour,
    ...display,
  };
});
