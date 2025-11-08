/**
 * Three.js global configuration
 * This file must be imported BEFORE any other Three.js imports
 */
import * as THREE from "three";

// Use Blender-style Z-up coordinate system globally
// This affects all helpers, gizmos, and default camera orientations
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

export default THREE;
