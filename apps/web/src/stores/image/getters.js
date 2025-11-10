import { computed } from "vue";

/**
 * Create computed getters for the image store
 * @param {Object} state - State refs from createImageState
 * @returns {Object} Computed getters
 */
export function createGetters(state) {
  /**
   * Mesh generation configuration - aggregates all parameters needed for mesh creation
   * This serves as the single source of truth for mesh generation config
   */
  const meshGenerationConfig = computed(() => {
    const effectiveResolution = Math.max(10, Math.floor(state.maxResolution.value * state.simplificationRatio.value));

    return {
      targetDepthMm: state.targetDepthMm.value,
      baseThicknessMm: state.baseThicknessMm.value,
      targetWidthMm: state.targetWidthMm.value,
      targetHeightMm: state.targetHeightMm.value,
      maxResolution: effectiveResolution,
      geometrySimplification: state.geometrySimplification.value,
      showTexture: state.showTexture.value,
      textureMap: state.textureMap.value, // Use custom texture if available, otherwise null
      itemColor: state.itemColor.value,
      enhanceDetails: state.enhanceDetails.value,
      detailEnhancementStrength: state.detailEnhancementStrength.value,
      detailThreshold: state.detailThreshold.value,
      preserveMajorFeatures: state.preserveMajorFeatures.value,
      smoothingKernelSize: state.smoothingKernelSize.value,
      enableContour: state.enableContour.value,
      contourThreshold: state.contourThreshold.value,
    };
  });

  return {
    meshGenerationConfig,
  };
}
