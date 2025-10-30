/**
 * Image dimension and resolution management
 */
export function createDimensionSetters(state) {
  const { imageDimensions, maxResolution, targetWidthMm, targetHeightMm } = state;

  /**
   * Set image dimensions
   * @param {Object} dimensions - {width, height}
   */
  function setImageDimensions(dimensions) {
    imageDimensions.value = dimensions;
  }

  /**
   * Set maximum resolution for mesh generation
   * @param {number|string} value - Max resolution in pixels
   */
  function setMaxResolution(value) {
    const parsed = parseInt(value);

    // If no dimensions yet, use safe default
    if (!imageDimensions.value) {
      maxResolution.value = Math.max(1, parsed || 1024);
      return;
    }

    const { width, height } = imageDimensions.value;
    const maxDim = Math.max(width, height);

    // Validate: minimum 1px for the maxResolution, maximum is original max dimension
    // This allows the smaller dimension to scale down below 1px if user wants
    const validated = Math.max(1, Math.min(maxDim, parsed || 1024));
    maxResolution.value = validated;
  }

  /**
   * Set target width in millimeters
   * @param {number|string|null} value - Width in mm
   */
  function setTargetWidthMm(value) {
    // Validate: must be null or positive number >= 1
    if (value === null || value === "") {
      targetWidthMm.value = null;
    } else {
      const validated = Math.max(1, parseFloat(value));
      targetWidthMm.value = validated;
    }
  }

  /**
   * Set target height in millimeters
   * @param {number|string|null} value - Height in mm
   */
  function setTargetHeightMm(value) {
    // Validate: must be null or positive number >= 1
    if (value === null || value === "") {
      targetHeightMm.value = null;
    } else {
      const validated = Math.max(1, parseFloat(value));
      targetHeightMm.value = validated;
    }
  }

  return {
    setImageDimensions,
    setMaxResolution,
    setTargetWidthMm,
    setTargetHeightMm,
  };
}
