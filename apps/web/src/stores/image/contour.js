/**
 * Contour flattening settings
 */
export function createContourSetters(state) {
  const { enableContour, contourThreshold } = state;

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

  return {
    setEnableContour,
    setContourThreshold,
  };
}
