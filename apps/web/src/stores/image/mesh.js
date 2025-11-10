/**
 * Mesh configuration parameters
 */
export function createMeshSetters(state) {
  const { targetDepthMm, baseThicknessMm, simplificationRatio, geometrySimplification } = state;

  /**
   * Set target depth in millimeters
   * @param {number|string} value - Depth in mm
   */
  function setTargetDepthMm(value) {
    // Validate: must be positive, minimum 0.1 mm (no max limit)
    const validated = Math.max(0.1, parseFloat(value));
    targetDepthMm.value = validated;
  }

  /**
   * Set base thickness in millimeters
   * @param {number|string} value - Thickness in mm
   */
  function setBaseThicknessMm(value) {
    // Validate: must be non-negative (0 or greater, no max limit)
    const validated = Math.max(0.0, parseFloat(value));
    baseThicknessMm.value = validated;
  }

  /**
   * Set mesh simplification ratio
   * @param {number|string} value - Ratio between 0.01 and 1.0
   */
  function setSimplificationRatio(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 0.01 and 1.0
    simplificationRatio.value = Math.max(0.01, Math.min(1.0, parsed || 1.0));
  }

  /**
   * Set geometry simplification ratio (post-processing)
   * @param {number|string} value - Ratio between 0.01 and 1.0
   */
  function setGeometrySimplification(value) {
    const parsed = parseFloat(value);
    // Validate: must be between 0.01 and 1.0
    geometrySimplification.value = Math.max(0.01, Math.min(1.0, parsed || 1.0));
  }

  return {
    setTargetDepthMm,
    setBaseThicknessMm,
    setSimplificationRatio,
    setGeometrySimplification,
  };
}
