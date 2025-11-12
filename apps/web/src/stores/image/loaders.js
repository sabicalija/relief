/**
 * Image loading functionality
 * Handles loading depth maps from files, URLs, and data URLs
 */
export function createLoaders(state) {
  const { depthMap, textureMap, imageDimensions, depthMapFilename, depthMapFileSize, showTexture, viewMode } = state;

  /**
   * Load a depth map from a File object
   * @param {File} file - Image file to load
   * @returns {Promise<void>}
   */
  function loadDepthMapFromFile(file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      console.warn("Please provide an image file");
      return Promise.reject(new Error("Invalid file type"));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result;
        if (!imageData) {
          reject(new Error("Failed to read file"));
          return;
        }

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Set image dimensions
          imageDimensions.value = {
            width: img.width,
            height: img.height,
          };

          // Set depth map and related state
          depthMap.value = imageData;
          textureMap.value = null; // No custom texture initially
          showTexture.value = true; // Use depth map as texture by default
          depthMapFilename.value = file.name;
          depthMapFileSize.value = file.size; // Store file size in bytes

          // Switch to 3D view
          viewMode.value = "3d";

          resolve();
        };
        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
        img.src = imageData;
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Set depth map from a data URL
   * @param {string} imageData - Base64 data URL
   * @param {string|null} filename - Optional filename
   */
  function setDepthMap(imageData, filename = null) {
    // Load image to get dimensions
    const img = new Image();
    img.onload = () => {
      // Set image dimensions
      imageDimensions.value = {
        width: img.width,
        height: img.height,
      };
    };
    img.src = imageData;

    depthMap.value = imageData;
    // Don't set textureMap here - let user choose to upload custom texture
    textureMap.value = null;
    showTexture.value = true; // Use depth map as texture by default
    if (filename) {
      depthMapFilename.value = filename;
    }
  }

  /**
   * Load depth map and optional texture from URLs
   * @param {string} depthUrl - URL to depth map image
   * @param {string|null} originalUrl - Optional URL to original texture
   * @param {string|null} filename - Optional filename
   * @returns {Promise<void>}
   */
  async function loadDepthMapFromUrl(depthUrl, originalUrl = null, filename = null) {
    try {
      // Fetch depth map (required)
      const depthResponse = await fetch(depthUrl);
      if (!depthResponse.ok) throw new Error(`Failed to fetch depth map: ${depthResponse.status}`);
      const depthBlob = await depthResponse.blob();

      // Store file size from blob
      depthMapFileSize.value = depthBlob.size;

      // Convert depth blob to data URL
      const depthDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Failed to read depth blob"));
        reader.readAsDataURL(depthBlob);
      });

      // If an original texture URL is provided, fetch and convert it as well
      let textureDataUrl = null;
      if (originalUrl) {
        const texResponse = await fetch(originalUrl);
        if (!texResponse.ok) throw new Error(`Failed to fetch texture: ${texResponse.status}`);
        const texBlob = await texResponse.blob();
        textureDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Failed to read texture blob"));
          reader.readAsDataURL(texBlob);
        });
      }

      // Use existing helpers to set depth map (this extracts dimensions)
      setDepthMap(depthDataUrl, filename || null);

      // If texture provided, set it as custom texture
      if (textureDataUrl) {
        textureMap.value = textureDataUrl;
        showTexture.value = true;
      }

      return;
    } catch (err) {
      console.error("Error in loadDepthMapFromUrl:", err);
      throw err;
    }
  }

  return {
    loadDepthMapFromFile,
    setDepthMap,
    loadDepthMapFromUrl,
  };
}
