/**
 * Grid Size Calculation Composable
 * Centralized logic for auto-calculating grid dimensions
 */
import { computed } from "vue";
import { Box3, Vector3 } from "three";

/**
 * Calculate grid size based on mesh or config
 * @param {Object} options
 * @param {Ref} options.mesh - The Three.js mesh object (or null)
 * @param {Object} options.imageStore - Image store instance
 * @param {Ref|null} options.manualSize - Manual override size (or null for auto)
 * @returns {ComputedRef<number>} Grid size in mm
 */
export function useGridSize({ mesh, imageStore, manualSize = null }) {
  return computed(() => {
    // Use manual override if set
    if (manualSize && manualSize.value !== null) {
      return manualSize.value;
    }

    // Calculate default mesh size minimum (100mm width)
    let minGridSize = 200; // Fallback default
    if (imageStore.imageDimensions) {
      const aspectRatio = imageStore.imageDimensions.width / imageStore.imageDimensions.height;
      const defaultWidth = 100;
      const defaultHeight = 100 / aspectRatio;
      const defaultMaxDimension = Math.max(defaultWidth, defaultHeight);
      minGridSize = Math.ceil((defaultMaxDimension * 2.5) / 50) * 50;
    }

    // If we have an actual mesh, use its bounding box
    if (mesh.value?.geometry) {
      const bbox = new Box3().setFromObject(mesh.value);
      const size = new Vector3();
      bbox.getSize(size);

      const meshWidth = size.x;
      const meshHeight = size.y;

      // Calculate grid size from actual mesh (2.5x mesh size, rounded to 50mm)
      const maxDimension = Math.max(meshWidth, meshHeight);
      const gridFromMesh = Math.ceil((maxDimension * 2.5) / 50) * 50;

      // Never go smaller than default mesh would produce
      return Math.max(minGridSize, gridFromMesh);
    }

    // No mesh yet - calculate from config
    const config = imageStore.meshGenerationConfig;
    const targetWidth = config.targetWidthMm;
    const targetHeight = config.targetHeightMm;

    // Calculate mesh dimensions (same logic as mesh generation)
    let meshWidth, meshHeight;

    if (imageStore.imageDimensions) {
      const aspectRatio = imageStore.imageDimensions.width / imageStore.imageDimensions.height;

      if (targetWidth && targetHeight) {
        meshWidth = targetWidth;
        meshHeight = targetHeight;
      } else if (targetWidth) {
        meshWidth = targetWidth;
        meshHeight = targetWidth / aspectRatio;
      } else if (targetHeight) {
        meshHeight = targetHeight;
        meshWidth = targetHeight * aspectRatio;
      } else {
        meshWidth = 100;
        meshHeight = 100 / aspectRatio;
      }

      // Calculate grid size from config
      const maxDimension = Math.max(meshWidth, meshHeight);
      const gridFromMesh = Math.ceil((maxDimension * 2.5) / 50) * 50;

      // Never go smaller than default mesh would produce
      return Math.max(minGridSize, gridFromMesh);
    }

    return minGridSize; // Default
  });
}

/**
 * Calculate grid divisions based on grid size
 * @param {ComputedRef<number>} gridSize - Grid size in mm
 * @param {Ref|null} manualDivisions - Manual override divisions (or null for auto)
 * @returns {ComputedRef<number>} Grid divisions
 */
export function useGridDivisions(gridSize, manualDivisions = null) {
  return computed(() => {
    // Use manual override if set
    if (manualDivisions && manualDivisions.value !== null) {
      return manualDivisions.value;
    }

    // Keep grid cell size constant at ~10mm per division
    return Math.round(gridSize.value / 10);
  });
}
