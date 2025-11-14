/**
 * Depth estimation utilities
 * Browser-based depth map generation using ML models
 */
export {
  generateDepthMap,
  isModelLoaded,
  isModelLoading,
  preloadModel,
  // New API
  MODEL_VARIANTS,
  EXECUTION_BACKENDS,
  getDefaultConfig,
  // TODO: Re-enable once WebGPU/WebNN backends are ready
  // isWebGPUAvailable,
  // isWebNNAvailable,
  isBackendSupported,
  getSupportedBackends,
  logBackendSupport,
  initDepthEstimatorWithConfig,
  // Legacy API (for backward compatibility)
  MODEL_CONFIGS,
  getDefaultModelConfig,
  initDepthEstimator,
} from "./estimation.js";
