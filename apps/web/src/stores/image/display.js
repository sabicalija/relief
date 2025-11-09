/**
 * Display and UI settings
 */
export function createDisplaySetters(state) {
  const { showTexture, showGrid, itemColor, textureMap, depthMap, imageDimensions, depthMapFilename } = state;

  /**
   * Set texture map data
   * @param {string} imageData - Base64 data URL
   */
  function setTextureMap(imageData) {
    textureMap.value = imageData;
    showTexture.value = true; // Automatically enable texture when loaded
  }

  /**
   * Clear texture map and disable custom texture
   */
  function clearTextureMap() {
    textureMap.value = null;
    showTexture.value = false; // Disable texture when cleared
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
   * Set item color for mesh
   * @param {string} value - Hex color code
   */
  function setItemColor(value) {
    itemColor.value = value;
  }

  return {
    setTextureMap,
    clearTextureMap,
    clearDepthMap,
    setShowTexture,
    setShowGrid,
    setItemColor,
  };
}
