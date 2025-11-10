/**
 * Mesh simplification utilities using Three.js SimplifyModifier
 *
 * Note: SimplifyModifier simplifies the entire mesh (top surface + bottom + walls).
 * For better performance with less quality loss, consider using Resolution Scaling instead,
 * which reduces vertex count before mesh generation and preserves all attributes.
 */
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";

/**
 * Simplify mesh geometry by reducing triangle count
 * @param {THREE.BufferGeometry} geometry - Geometry to simplify
 * @param {number} targetReduction - Target percentage of triangles to keep (0.0-1.0)
 *   1.0 = keep 100% (no simplification), 0.5 = keep 50%, 0.1 = keep 10%
 * @param {Object} statusStore - Optional viewer store for status updates
 * @returns {Promise<THREE.BufferGeometry>} Simplified geometry
 */
export async function simplifyGeometry(geometry, targetReduction = 1.0, statusStore = null) {
  // Skip if no simplification needed (>99%)
  if (targetReduction >= 0.99) {
    console.log("⏭️  Skipping simplification (>99%)");
    return geometry;
  }

  // Ensure we have an index
  if (!geometry.index) {
    geometry = geometry.toNonIndexed();
  }

  // Calculate original stats
  const originalCount = geometry.attributes.position.count;

  // SimplifyModifier.modify() second parameter is the COUNT of vertices to REMOVE
  // So if we want to keep 10%, we need to remove 90%
  const verticesToRemove = Math.floor(originalCount * (1.0 - targetReduction));

  // Skip simplification for very large meshes (too slow)
  if (originalCount > 100000) {
    console.warn(`⚠️  Mesh too large for simplification (${originalCount} vertices). Use Resolution Scaling instead.`);
    return geometry;
  }

  console.log(
    `🔄 Simplifying geometry: ${originalCount} vertices, removing ${verticesToRemove} (keep ${(
      targetReduction * 100
    ).toFixed(0)}%)`
  );

  // Show status message if store is available and wait for UI to update
  let statusId = null;
  if (statusStore) {
    statusId = statusStore.showGenerating(`Simplifying mesh (keep ${(targetReduction * 100).toFixed(0)}%)...`);
    console.log("📊 Status message shown, ID:", statusId);

    // CRITICAL: Give Vue time to render the status message before blocking the thread
    // Use a tiny delay to allow the UI to update
    await new Promise((resolve) => setTimeout(resolve, 50));
  } else {
    console.log("⚠️  No status store available for simplification");
  }

  try {
    const startTime = performance.now();
    const modifier = new SimplifyModifier();

    // Clone geometry to preserve original attributes
    const toSimplify = geometry.clone();

    // Store original groups before simplification
    const originalGroups = geometry.groups.length > 0 ? [...geometry.groups] : null;

    // Apply simplification - second parameter is COUNT of vertices to REMOVE
    const simplified = modifier.modify(toSimplify, verticesToRemove);

    // Restore material groups if they existed
    // Since SimplifyModifier loses groups, we need to recreate them
    // We'll assign all faces to the first material (index 0) as a fallback
    if (originalGroups && originalGroups.length > 0 && simplified.groups.length === 0) {
      const faceCount = simplified.index ? simplified.index.count : simplified.attributes.position.count;
      simplified.addGroup(0, faceCount, 0); // All faces use material index 0
      console.log("📝 Restored material group (all faces use first material)");
    }

    const elapsed = performance.now() - startTime;
    const finalCount = simplified.attributes.position.count;
    const triangleCount = (simplified.index?.count || 0) / 3;

    console.log(
      `✅ Simplified in ${elapsed.toFixed(0)}ms: ${finalCount} vertices, ${triangleCount.toFixed(0)} triangles (${(
        (finalCount / originalCount) *
        100
      ).toFixed(1)}% of original)`
    );

    // SimplifyModifier only preserves position and normal attributes
    // We lose UVs (textures) and material groups, but the mesh will still render with solid colors
    console.warn("⚠️  Simplification removes textures and material groups. Mesh will use solid color only.");

    // Debug: Check what attributes we have
    console.log("🔍 Simplified geometry attributes:", Object.keys(simplified.attributes));
    console.log("🔍 Has index:", !!simplified.index);
    console.log("🔍 Has groups:", simplified.groups.length);

    // Remove status message
    if (statusStore && statusId) {
      statusStore.removeStatus(statusId);
    }

    return simplified;
  } catch (error) {
    console.error("❌ Simplification failed:", error);
    console.log("↩️  Using original geometry");

    // Remove status message on error
    if (statusStore && statusId) {
      statusStore.removeStatus(statusId);
    }

    return geometry;
  }
}
