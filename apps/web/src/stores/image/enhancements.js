/**
 * Depth enhancement settings
 */
export function createEnhancementSetters(state) {
  const { enhanceDetails, detailEnhancementStrength, detailThreshold, preserveMajorFeatures, smoothingKernelSize } =
    state;

  /**
   * Enable/disable detail enhancement
   * @param {boolean} value
   */
  function setEnhanceDetails(value) {
    enhanceDetails.value = value;
  }

  /**
   * Set detail enhancement strength
   * @param {number|string} value - Strength between 1.0 and 5.0
   */
  function setDetailEnhancementStrength(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 1.0 and 5.0
    detailEnhancementStrength.value = Math.max(1.0, Math.min(5.0, parsed || 1.5));
  }

  /**
   * Set detail threshold
   * @param {number|string} value - Threshold between 0.0 and 1.0
   */
  function setDetailThreshold(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 0.0 and 1.0
    detailThreshold.value = Math.max(0.0, Math.min(1.0, parsed || 0.1));
  }

  /**
   * Enable/disable preserving major features
   * @param {boolean} value
   */
  function setPreserveMajorFeatures(value) {
    preserveMajorFeatures.value = value;
  }

  /**
   * Set smoothing kernel size
   * @param {number|string} value - Odd number between 1 and 15
   */
  function setSmoothingKernelSize(value) {
    const parsed = parseInt(value);
    // Validate: must be odd number between 1 and 15
    let validated = Math.max(1, Math.min(15, parsed || 3));
    // Make it odd
    if (validated % 2 === 0) validated += 1;
    smoothingKernelSize.value = validated;
  }

  return {
    setEnhanceDetails,
    setDetailEnhancementStrength,
    setDetailThreshold,
    setPreserveMajorFeatures,
    setSmoothingKernelSize,
  };
}
