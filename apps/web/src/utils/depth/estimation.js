/**
 * Depth estimation using Depth Anything V2 Small model
 * Runs in the browser via Transformers.js
 */
import { pipeline, env, RawImage } from "@huggingface/transformers";

// Configure Transformers.js for browser usage
env.allowLocalModels = true; // Enable local model loading
env.allowRemoteModels = true;

// Configure ONNX Runtime to use Web Workers (runs off main thread)
// Automatically falls back to main thread if workers not supported
env.backends.onnx.wasm.proxy = typeof Worker !== "undefined"; // Enable worker-based execution if available

// Point to JSEP WASM files for WebGPU support
// These files enable GPU acceleration via WebGPU
env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

// Log worker availability
if (env.backends.onnx.wasm.proxy) {
  console.log("[Depth] Web Workers enabled - inference will run off main thread");
} else {
  console.warn("[Depth] Web Workers not available - inference will run on main thread (UI may freeze)");
}

// Cache for multiple pipeline instances (one per config)
const pipelineCache = new Map(); // key: "variant_backend", value: pipeline instance
const loadingPromises = new Map(); // Track ongoing loads per config
let currentConfig = null; // Track currently active config

// Available model configurations
// Available model variants
export const MODEL_VARIANTS = {
  q8: {
    name: "Q8 Quantized",
    modelFile: "model_quantized.onnx",
    size: "26 MB",
    dtype: "q8",
    description: "Fast, smallest size",
    recommendedBackend: "wasm", // Q8 is optimized for CPU
  },
  fp16: {
    name: "FP16 Half Precision",
    modelFile: "model_fp16.onnx",
    size: "47 MB",
    dtype: "fp16",
    description: "Balanced quality and size",
    recommendedBackend: "webgpu", // FP16 works well on GPU
  },
  fp32: {
    name: "FP32 Full Precision",
    modelFile: "model.onnx",
    size: "95 MB",
    dtype: "fp32",
    description: "Highest quality, largest size",
    recommendedBackend: "webgpu", // FP32 benefits from GPU
  },
};

// Execution backends
export const EXECUTION_BACKENDS = {
  wasm: {
    name: "CPU (WASM)",
    device: "wasm",
    description: "Run on CPU, works everywhere",
    requiresFeature: null, // Always available
  },
  // TODO: Re-enable once backend-specific issues are resolved
  // webnn: {
  //   name: "WebNN",
  //   device: "webnn",
  //   description: "Web Neural Network API (hardware-accelerated ML)",
  //   requiresFeature: "webnn",
  // },
  // webgpu: {
  //   name: "GPU (WebGPU)",
  //   device: "webgpu",
  //   description: "Run on GPU, faster but experimental",
  //   requiresFeature: "webgpu",
  // },
};

/**
 * Check if WebGPU is available in the current browser
 * @returns {boolean}
 */
// TODO: Re-enable once WebGPU backend is ready
// export function isWebGPUAvailable() {
//   return typeof navigator !== "undefined" && navigator.gpu !== undefined;
// }

/**
 * Check if WebNN is available in the current browser
 * @returns {boolean}
 */
// TODO: Re-enable once WebNN backend is ready
// export function isWebNNAvailable() {
//   // Check for ML (Web Neural Network API)
//   // Chrome/Edge: window.ml or navigator.ml
//   return (
//     (typeof window !== "undefined" && window.ml !== undefined) ||
//     (typeof navigator !== "undefined" && navigator.ml !== undefined)
//   );
// }

/**
 * Check if a specific backend is supported by the browser
 * @param {string} backendKey - Backend key (e.g., "wasm", "webgpu", "webnn")
 * @returns {boolean}
 */
export function isBackendSupported(backendKey) {
  const backend = EXECUTION_BACKENDS[backendKey];
  if (!backend) return false;

  // Only WASM is currently enabled
  switch (backend.requiresFeature) {
    case null:
    default:
      return true; // WASM is always available
    // TODO: Re-enable once WebGPU/WebNN backends are ready
    // case "webgpu":
    //   return isWebGPUAvailable();
    // case "webnn":
    //   return isWebNNAvailable();
  }
}

/**
 * Get all backends supported by the current browser
 * @returns {Array<{key: string, config: object}>}
 */
export function getSupportedBackends() {
  return Object.entries(EXECUTION_BACKENDS)
    .filter(([key]) => isBackendSupported(key))
    .map(([key, config]) => ({ key, config }));
}

/**
 * Log browser support for ML backends (for debugging)
 */
export function logBackendSupport() {
  const supportedBackends = getSupportedBackends();

  console.log("[Depth] Browser ML Backend Support:");
  console.log("  WASM:", isBackendSupported("wasm") ? "✓ Available" : "✗ Not available");
  // TODO: Re-enable once WebGPU/WebNN backends are ready
  // console.log("  WebNN:", isBackendSupported("webnn") ? "✓ Available" : "✗ Not available");
  // console.log("  WebGPU:", isBackendSupported("webgpu") ? "✓ Available" : "✗ Not available");

  console.log(`\n[Depth] ${supportedBackends.length} backend(s) available in dropdown`);

  // TODO: Re-enable once WebGPU/WebNN backends are ready
  // if (!isWebNNAvailable()) {
  //   console.log("\n[Depth] To enable WebNN in Chrome (version 124+):");
  //   console.log("  1. Navigate to chrome://flags/#web-machine-learning-neural-network");
  //   console.log("  2. Set to 'Enabled'");
  //   console.log("  3. Restart browser");
  // }

  // if (!isWebGPUAvailable()) {
  //   console.log("\n[Depth] WebGPU requires Chrome 113+, Edge 113+, or Safari TP");
  // }

  console.log("\n[Depth] See Transformers.js benchmarks: https://github.com/huggingface/transformers.js-benchmarking");
}

// Log backend support on module load
logBackendSupport();

// Legacy: Keep MODEL_CONFIGS for backward compatibility (will be removed later)
export const MODEL_CONFIGS = {
  q8_wasm: {
    name: "Q8 + WASM (Fast, 26MB)",
    dtype: "q8",
    device: "wasm",
    modelFile: "model_quantized.onnx",
    size: "26 MB",
    description: "CPU-optimized, fastest for CPU-only devices",
  },
  fp16_wasm: {
    name: "FP16 + WASM (Balanced, 47MB)",
    dtype: "fp16",
    device: "wasm",
    modelFile: "model_fp16.onnx",
    size: "47 MB",
    description: "Good quality, moderate speed on CPU",
  },
  // WebGPU configs removed - unstable, causes heat/performance issues
  // fp16_webgpu: {
  //   name: "FP16 + WebGPU (Fast, 47MB)",
  //   dtype: "fp16",
  //   device: "webgpu",
  //   modelFile: "model_fp16.onnx",
  //   size: "47 MB",
  //   description: "GPU-accelerated, best performance with WebGPU",
  //   requiresWebGPU: true,
  // },
  fp32_wasm: {
    name: "FP32 + WASM (Best Quality, 95MB)",
    dtype: "fp32",
    device: "wasm",
    modelFile: "model.onnx",
    size: "95 MB",
    description: "Highest quality, slower on CPU",
  },
  // WebGPU configs removed - unstable, causes heat/performance issues
  // fp32_webgpu: {
  //   name: "FP32 + WebGPU (Best Quality, 95MB)",
  //   dtype: "fp32",
  //   device: "webgpu",
  //   modelFile: "model.onnx",
  //   size: "95 MB",
  //   description: "Highest quality, GPU-accelerated",
  //   requiresWebGPU: true,
  // },
};

// Model sources (primary + fallback)
// NOTE: Self-hosted first due to HF CDN returning HTML errors (rate limits?)
// TODO: Switch back to HF CDN primary once issues resolved
const MODEL_SOURCES = [
  { id: `${import.meta.env.BASE_URL}models/depth-anything-v2-small`, local: true }, // Primary: Self-hosted (reliable)
  { id: "onnx-community/depth-anything-v2-small", local: false }, // Fallback: Hugging Face CDN
];

/**
 * Get default model variant and backend based on WebGPU availability
 * @returns {{variant: string, backend: string}}
 */
export function getDefaultConfig() {
  // WebGPU disabled for now - unstable, causes performance issues
  return {
    variant: "q8", // Default to fastest CPU-optimized variant
    backend: "wasm",
  };
}

/**
 * Get default model config based on WebGPU availability (legacy)
 */
export function getDefaultModelConfig() {
  // WebGPU disabled for now
  return "q8_wasm";
}

/**
 * Initialize the depth estimation pipeline with variant and backend
 * @param {string} variant - Model variant key (e.g., "q8", "fp16", "fp32")
 * @param {string} backend - Execution backend key (e.g., "wasm", "webgpu")
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<any>} The depth estimation pipeline
 */
export async function initDepthEstimatorWithConfig(variant = null, backend = null, onProgress = null) {
  // Use defaults if not specified
  if (!variant || !backend) {
    const defaults = getDefaultConfig();
    variant = variant || defaults.variant;
    backend = backend || defaults.backend;
  }

  const modelVariant = MODEL_VARIANTS[variant];
  const executionBackend = EXECUTION_BACKENDS[backend];

  if (!modelVariant) {
    throw new Error(`Unknown model variant: ${variant}`);
  }
  if (!executionBackend) {
    throw new Error(`Unknown execution backend: ${backend}`);
  }

  // Build config key for caching
  const configKey = `${variant}_${backend}`;

  // If already loaded with this config, return cached pipeline
  if (pipelineCache.has(configKey)) {
    console.log(`[Depth] Using cached pipeline: ${configKey}`);
    currentConfig = configKey;
    return pipelineCache.get(configKey);
  }

  // If already loading this config, return the existing promise
  if (loadingPromises.has(configKey)) {
    console.log(`[Depth] Loading already in progress for: ${configKey}`);
    return loadingPromises.get(configKey);
  }

  const config = {
    dtype: modelVariant.dtype,
    device: executionBackend.device,
    modelFile: modelVariant.modelFile,
    size: modelVariant.size,
    name: `${modelVariant.name} + ${executionBackend.name}`,
  };

  const loadingPromise = (async () => {
    let lastError = null;

    console.log(`[Depth] Loading model: ${config.name}`);
    console.log(`[Depth] Config: dtype=${config.dtype}, device=${config.device}, size=${config.size}`);

    // Try each model source in order
    for (let i = 0; i < MODEL_SOURCES.length; i++) {
      const { id: modelPath, local: isLocal } = MODEL_SOURCES[i];
      const isLastSource = i === MODEL_SOURCES.length - 1;
      const sourceType = i === 0 ? "Self-hosted (primary)" : "Hugging Face CDN (fallback)";

      try {
        console.log(`[Depth] Attempting to load from: ${modelPath}`);
        console.log(`[Depth] Source type: ${sourceType}`);
        console.log(`[Depth] This may take a moment on first use (~${config.size} download)`);
        console.log("[Depth] Check Network tab for:", isLocal ? "localhost/relief/models/" : "huggingface.co");
        console.log("[Depth] Or check Cache Storage if already downloaded");

        const startTime = performance.now();

        // Use config-specified dtype and device
        const options = {
          dtype: config.dtype,
          device: config.device,
          progress_callback: (progress) => {
            if (progress.status === "progress") {
              const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
              console.log(
                `[Depth] Downloading ${progress.file}: ${percent}% (${(progress.loaded / 1024 / 1024).toFixed(
                  1
                )}MB / ${(progress.total / 1024 / 1024).toFixed(1)}MB)`
              );
              // Call external progress callback if provided
              if (onProgress) {
                onProgress(progress);
              }
            } else if (progress.status === "done") {
              console.log(`[Depth] ✓ Downloaded ${progress.file}`);
              if (onProgress) {
                onProgress(progress);
              }
            } else if (progress.status === "initiate") {
              console.log(`[Depth] Initiating download: ${progress.file}`);
              if (onProgress) {
                onProgress(progress);
              }
            }
          },
          // NOTE: Don't use local_files_only for self-hosted models - it breaks relative URL loading
          // Transformers.js automatically detects relative URLs and fetches from same origin
        };

        // Load the model
        const depthEstimator = await pipeline("depth-estimation", modelPath, options);

        const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Depth] ✓ Pipeline initialized in ${loadTime}s`);

        // Log which device is being used
        const actualDevice = depthEstimator.model?.device || options.device;
        console.log(`[Depth] ✓ Model loaded successfully!`);
        console.log(`[Depth] Model source: ${sourceType}`);
        console.log(`[Depth] Execution device: ${actualDevice}`);

        // Cache the pipeline
        pipelineCache.set(configKey, depthEstimator);
        currentConfig = configKey;

        // Clean up loading promise
        loadingPromises.delete(configKey);

        return depthEstimator;
      } catch (error) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(`[Depth] ✗ Failed to load from ${sourceType}:`, errorMsg);

        // Check if this is a backend-specific error (WebNN/WebGPU not working)
        const isBackendError =
          errorMsg.includes("webnn") ||
          errorMsg.includes("webgpu") ||
          errorMsg.includes("no available backend") ||
          errorMsg.includes("execution provider");

        if (isBackendError && config.device !== "wasm") {
          console.warn(`[Depth] Backend '${config.device}' failed. Consider using WASM for better compatibility.`);
        }

        // If not the last source, try next one
        if (!isLastSource) {
          console.log("[Depth] Trying fallback source...");
          continue;
        }

        // All sources failed
        console.error("[Depth] All model sources failed. Last error:");
        console.error("[Depth] Error name:", error.name);
        console.error("[Depth] Error message:", error.message);
        console.error("[Depth] Error stack:", error.stack);

        // Clean up loading promise on error
        loadingPromises.delete(configKey);

        // Provide helpful error message
        let userMessage = error.message;
        if (error.message.includes("fetch") || error.message.includes("not valid JSON")) {
          userMessage =
            "Network error: Unable to download model files. Please check your internet connection and try again.";
        } else if (error.message.includes("ONNX")) {
          userMessage = "Model loading error. The model file may be corrupted or incompatible.";
        }

        throw new Error(userMessage);
      }
    }

    throw lastError; // Should never reach here, but just in case
  })();

  // Track this loading promise
  loadingPromises.set(configKey, loadingPromise);

  return loadingPromise;
}

/**
 * Initialize the depth estimation pipeline with specified configuration (legacy)
 * @param {string} configKey - Key from MODEL_CONFIGS (e.g., "q8_wasm", "fp16_webgpu") or variant_backend format
 * @returns {Promise<any>} The depth estimation pipeline
 */
export async function initDepthEstimator(configKey = null) {
  // Use default if not specified
  if (!configKey) {
    configKey = getDefaultModelConfig();
  }

  // Check if this is a legacy MODEL_CONFIGS key
  const config = MODEL_CONFIGS[configKey];

  if (config) {
    // Legacy path: extract variant and backend from config
    const [variant, backend] = configKey.split("_");
    return initDepthEstimatorWithConfig(variant, backend);
  }

  // New path: parse variant_backend format directly (e.g., "q8_webnn", "fp16_webgpu")
  // This handles cases where new backend combinations aren't in MODEL_CONFIGS
  const parts = configKey.split("_");
  if (parts.length === 2) {
    const [variant, backend] = parts;

    // Validate that variant and backend exist
    if (MODEL_VARIANTS[variant] && EXECUTION_BACKENDS[backend]) {
      console.log(`[Depth] Using dynamic config: ${variant}_${backend}`);
      return initDepthEstimatorWithConfig(variant, backend);
    }
  }

  // If we get here, the config key is invalid
  throw new Error(`Unknown model config: ${configKey}. Use format "variant_backend" (e.g., "q8_wasm", "fp16_webnn")`);
}

// Legacy code below (kept for reference, remove after full migration)
/*
async function initDepthEstimatorOld(configKey = null) {
  // Use default if not specified
  if (!configKey) {
    configKey = getDefaultModelConfig();
  }

  const config = MODEL_CONFIGS[configKey];
  if (!config) {
    throw new Error(`Unknown model config: ${configKey}`);
  }

  // If already loaded with same config, return it
  if (depthEstimator && currentConfig === configKey) {
    return depthEstimator;
  }

  // If loading different config, invalidate current estimator
// Legacy code below (kept for reference, remove after full migration)
/*
async function initDepthEstimatorOld(configKey = null) {
  // Use default if not specified
  if (!configKey) {
    configKey = getDefaultModelConfig();
  }

  const config = MODEL_CONFIGS[configKey];
  if (!config) {
    throw new Error(`Unknown model config: ${configKey}`);
  }

  // If already loaded with same config, return it
  if (depthEstimator && currentConfig === configKey) {
    return depthEstimator;
  }

  // If loading different config, invalidate current estimator
  if (currentConfig !== configKey) {
    depthEstimator = null;
    currentConfig = null;
  }
  if (depthEstimator) return depthEstimator;

  if (isLoading) {
    return loadingPromise;
  }

  isLoading = true;
  loadingPromise = (async () => {
    // ... old implementation code ...
  })().finally(() => {
    isLoading = false;
    loadingPromise = null;
  });

  return loadingPromise;
}
*/

/**
 * Generate depth map from an image
 * @param {string|HTMLImageElement} image - Image data URL or Image element
 * @param {string} configKey - Model configuration key (e.g., "q8_wasm", "fp16_webgpu")
 * @param {Function} onProgress - Optional progress callback (receives download progress)
 * @returns {Promise<{depthMap: string, width: number, height: number}>}
 */
export async function generateDepthMap(image, configKey = null, onProgress = null) {
  try {
    // Initialize model (will cache after first load)
    const estimator = await initDepthEstimator(configKey);

    // Convert input to appropriate format
    let inputImage;
    if (typeof image === "string") {
      // Load from data URL
      console.log("[Depth] Loading image from data URL...");
      inputImage = await RawImage.fromURL(image);
    } else if (image instanceof HTMLImageElement) {
      // Convert HTMLImageElement to RawImage
      console.log("[Depth] Converting HTMLImageElement to RawImage...");
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      inputImage = await RawImage.fromURL(canvas.toDataURL());
    } else {
      inputImage = image;
    }

    console.log("[Depth] Running depth estimation...");

    // Run depth estimation
    const result = await estimator(inputImage);

    // Result contains:
    // - depth: RawImage with depth values
    // - predicted_depth: tensor (optional)
    const { depth } = result;

    console.log("[Depth] Processing depth map...");

    // Convert depth RawImage to canvas for visualization
    const canvas = document.createElement("canvas");
    canvas.width = depth.width;
    canvas.height = depth.height;
    const ctx = canvas.getContext("2d");

    // RawImage.data is Uint8ClampedArray for depth estimation output
    // Depth values are already normalized by the model
    const depthData = depth.data;
    const imageData = ctx.createImageData(depth.width, depth.height);

    // Copy depth data to canvas (grayscale)
    for (let i = 0; i < depth.width * depth.height; i++) {
      const idx = i * 4;
      const gray = depthData[i]; // Already in 0-255 range
      imageData.data[idx] = gray; // R
      imageData.data[idx + 1] = gray; // G
      imageData.data[idx + 2] = gray; // B
      imageData.data[idx + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to data URL
    const depthMapDataURL = canvas.toDataURL("image/png");

    console.log("[Depth] Depth map generated successfully");

    return {
      depthMap: depthMapDataURL,
      width: depth.width,
      height: depth.height,
    };
  } catch (error) {
    console.error("[Depth] Failed to generate depth map:", error);
    throw error;
  }
}

/**
 * Check if a model with the given config is already loaded
 * @param {string} variant - Model variant (optional, uses current if not specified)
 * @param {string} backend - Execution backend (optional, uses current if not specified)
 * @returns {boolean}
 */
export function isModelLoaded(variant = null, backend = null) {
  if (!variant || !backend) {
    // Check if any model is loaded
    return pipelineCache.size > 0;
  }
  const configKey = `${variant}_${backend}`;
  return pipelineCache.has(configKey);
}

/**
 * Check if a model is currently loading
 * @param {string} variant - Model variant (optional, checks any if not specified)
 * @param {string} backend - Execution backend (optional, checks any if not specified)
 * @returns {boolean}
 */
export function isModelLoading(variant = null, backend = null) {
  if (!variant || !backend) {
    // Check if any model is loading
    return loadingPromises.size > 0;
  }
  const configKey = `${variant}_${backend}`;
  return loadingPromises.has(configKey);
}

/**
 * Preload the model without generating a depth map
 * Useful for warming up during app initialization
 * @param {Function} onProgress - Optional progress callback (progress: {status, loaded, total, file})
 * @param {string} variant - Model variant to load (defaults to getDefaultConfig())
 * @param {string} backend - Execution backend to use (defaults to getDefaultConfig())
 * @returns {Promise<void>}
 */
export async function preloadModel(onProgress = null, variant = null, backend = null) {
  if (!variant || !backend) {
    const defaults = getDefaultConfig();
    variant = variant || defaults.variant;
    backend = backend || defaults.backend;
  }
  await initDepthEstimatorWithConfig(variant, backend, onProgress);
}
