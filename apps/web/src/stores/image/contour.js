/**
 * Contour flattening settings
 */
export function createContourSetters(state) {
  const { enableContour, contourThreshold, flattenAboveThreshold, flattenBelowThreshold } = state;

  /**
   * Enable/disable contour flattening
   * @param {boolean} value
   */
  function setEnableContour(value) {
    enableContour.value = value;
  }

  /**
   * Set contour threshold
   * @param {number|string} value - Z threshold between 0.0 and 1.0
   */
  function setContourThreshold(value) {
    const parsed = parseFloat(value);
    contourThreshold.value = Math.max(0.0, Math.min(1.0, parsed || 0.8));
  }

  /**
   * Set flatten above threshold (can be combined with flattenBelowThreshold)
   * At least one must be enabled when contour is active
   * @param {boolean} value
   */
  function setFlattenAboveThreshold(value) {
    flattenAboveThreshold.value = value;
    // Ensure at least one is enabled when contour is active
    if (enableContour.value && !value && !flattenBelowThreshold.value) {
      flattenBelowThreshold.value = true;
    }
  }

  /**
   * Set flatten below threshold (can be combined with flattenAboveThreshold)
   * At least one must be enabled when contour is active
   * @param {boolean} value
   */
  function setFlattenBelowThreshold(value) {
    flattenBelowThreshold.value = value;
    // Ensure at least one is enabled when contour is active
    if (enableContour.value && !value && !flattenAboveThreshold.value) {
      flattenAboveThreshold.value = true;
    }
  }

  return {
    setEnableContour,
    setContourThreshold,
    setFlattenAboveThreshold,
    setFlattenBelowThreshold,
  };
}
