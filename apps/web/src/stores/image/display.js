/**
 * Display and UI settings
 */
export function createDisplaySetters(state) {
  const {
    showTexture,
    showGrid,
    baseColor,
    textureMap,
    useCustomTexture,
    depthMap,
    imageDimensions,
    depthMapFilename,
  } = state;

  /**
   * Set texture map data
   * @param {string} imageData - Base64 data URL
   */
  function setTextureMap(imageData) {
    textureMap.value = imageData;
  }

  /**
   * Clear texture map and disable custom texture
   */
  function clearTextureMap() {
    textureMap.value = null;
    useCustomTexture.value = false;
  }

  /**
   * Clear all depth map related data
   */
  function clearDepthMap() {
    depthMap.value = null;
    textureMap.value = null;
    imageDimensions.value = null;
    depthMapFilename.value = null;
  }

  /**
   * Enable/disable texture display
   * @param {boolean} value
   */
  function setShowTexture(value) {
    showTexture.value = value;
  }

  /**
   * Enable/disable grid helper
   * @param {boolean} value
   */
  function setShowGrid(value) {
    showGrid.value = value;
  }

  /**
   * Set base color for mesh perimeter and bottom
   * @param {string} value - Hex color code
   */
  function setBaseColor(value) {
    baseColor.value = value;
  }

  /**
   * Enable/disable custom texture usage
   * @param {boolean} value
   */
  function setUseCustomTexture(value) {
    useCustomTexture.value = value;
  }

  return {
    setTextureMap,
    clearTextureMap,
    clearDepthMap,
    setShowTexture,
    setShowGrid,
    setBaseColor,
    setUseCustomTexture,
  };
}
