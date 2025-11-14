/**
 * Depth map generation functionality
 * Generate depth maps from regular images using ML models
 */
import {
  generateDepthMap as generateDepthMapML,
  isModelLoaded,
  isModelLoading,
  // New API
  MODEL_VARIANTS,
  EXECUTION_BACKENDS,
  getDefaultConfig,
  // TODO: Re-enable once WebGPU backend is ready
  // isWebGPUAvailable,
  // Legacy API
  MODEL_CONFIGS,
  getDefaultModelConfig,
} from "@/utils/depth";

export function createDepthGenerator(state) {
  const {
    depthMap,
    textureMap,
    imageDimensions,
    depthMapFilename,
    depthMapFileSize,
    showTexture,
    viewMode,
    maxResolution,
    depthModelVariant,
    depthExecutionBackend,
    depthModelConfig, // Legacy
  } = state;

  /**
   * Set the depth model variant (q8, fp16, fp32)
   * @param {string} variant - Model variant key
   */
  function setDepthModelVariant(variant) {
    if (!MODEL_VARIANTS[variant]) {
      console.error(`[Store] Unknown model variant: ${variant}`);
      return;
    }
    depthModelVariant.value = variant;
    console.log(`[Store] Depth model variant set to: ${variant}`);
  }

  /**
   * Set the execution backend (wasm, webgpu)
   * @param {string} backend - Backend key
   */
  function setDepthExecutionBackend(backend) {
    if (!EXECUTION_BACKENDS[backend]) {
      console.error(`[Store] Unknown execution backend: ${backend}`);
      return;
    }
    depthExecutionBackend.value = backend;
    console.log(`[Store] Execution backend set to: ${backend}`);
  }

  /**
   * Get available model variants
   */
  function getAvailableModelVariants() {
    return Object.entries(MODEL_VARIANTS);
  }

  /**
   * Get available execution backends (filtered by WebGPU availability)
   */
  function getAvailableExecutionBackends() {
    // TODO: Re-enable WebGPU filtering once backend is ready
    // const hasWebGPU = isWebGPUAvailable();
    return Object.entries(EXECUTION_BACKENDS).filter(([key, backend]) => {
      return !backend.requiresWebGPU; // Only show non-WebGPU backends for now
    });
  }

  /**
   * Set the depth model configuration (legacy)
   * @param {string} configKey - Model config key (e.g., "q8_wasm", "fp16_webgpu")
   */
  function setDepthModelConfig(configKey) {
    if (!MODEL_CONFIGS[configKey]) {
      console.error(`[Store] Unknown model config: ${configKey}`);
      return;
    }
    depthModelConfig.value = configKey;
    // Also set variant and backend for consistency
    const [variant, backend] = configKey.split("_");
    depthModelVariant.value = variant;
    depthExecutionBackend.value = backend;
    console.log(`[Store] Depth model config set to: ${configKey}`);
  }

  /**
   * Get available model configs (filtered by WebGPU availability) - legacy
   */
  function getAvailableModelConfigs() {
    // TODO: Re-enable WebGPU filtering once backend is ready
    // const hasWebGPU = isWebGPUAvailable();
    return Object.entries(MODEL_CONFIGS).filter(([key, config]) => {
      // Filter out WebGPU configs if WebGPU is not available
      return !config.requiresWebGPU; // Only show non-WebGPU configs for now
    });
  }

  /**
   * Generate depth map from an uploaded image
   * @param {string|HTMLImageElement} sourceImage - Image data URL or Image element
   * @param {string} filename - Original filename
   * @param {Function} onProgress - Optional progress callback
   * @returns {Promise<void>}
   */
  async function generateDepthMapFromImage(sourceImage, filename = "generated-depth", onProgress = null) {
    try {
      console.log("[Store] Generating depth map from image...");

      // Use new API if variant and backend are set, otherwise use legacy configKey
      let configKey;
      if (depthModelVariant.value && depthExecutionBackend.value) {
        configKey = `${depthModelVariant.value}_${depthExecutionBackend.value}`;
        console.log(`[Store] Using model variant: ${depthModelVariant.value}, backend: ${depthExecutionBackend.value}`);
      } else {
        // Fallback to legacy config or default
        configKey = depthModelConfig.value || getDefaultModelConfig();
        console.log(`[Store] Using model config: ${configKey}`);
      }

      // Generate depth map using ML model (blocks main thread)
      const result = await generateDepthMapML(sourceImage, configKey, onProgress);

      // Set image dimensions
      imageDimensions.value = {
        width: result.width,
        height: result.height,
      };

      // Adjust maxResolution to not exceed source image max dimension
      const sourceMaxDim = Math.max(result.width, result.height);
      if (maxResolution.value > sourceMaxDim) {
        maxResolution.value = sourceMaxDim;
      }

      // Set depth map as the generated result
      depthMap.value = result.depthMap;

      // Store original image as texture
      if (typeof sourceImage === "string") {
        textureMap.value = sourceImage;
      } else {
        // Convert HTMLImageElement to data URL
        const canvas = document.createElement("canvas");
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(sourceImage, 0, 0);
        textureMap.value = canvas.toDataURL("image/png");
      }

      // Enable texture display by default
      showTexture.value = true;

      // Update filename
      const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove extension
      depthMapFilename.value = `${baseName}-depth.png`;

      // Estimate file size (rough approximation based on PNG data URL length)
      const base64Length = result.depthMap.split(",")[1]?.length || 0;
      depthMapFileSize.value = Math.floor((base64Length * 3) / 4);

      // Switch to 3D view
      viewMode.value = "3d";

      console.log("[Store] Depth map generated successfully");
    } catch (error) {
      console.error("[Store] Failed to generate depth map:", error);
      throw error;
    }
  }

  return {
    generateDepthMapFromImage,
    // New API
    setDepthModelVariant,
    setDepthExecutionBackend,
    getAvailableModelVariants,
    getAvailableExecutionBackends,
    // Legacy API
    setDepthModelConfig,
    getAvailableModelConfigs,
    // Status
    isDepthModelLoaded: () => isModelLoaded(),
    isDepthModelLoading: () => isModelLoading(),
  };
}
