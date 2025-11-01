# Viewer Components

Modular viewer system for 2D depth maps and 3D relief models.

## Directory Structure

```
components/viewer/
├── Viewer.vue                        # Main entry point
│
├── 2d/                               # 2D viewer
│   └── Viewer2D.vue                 # Depth map visualization
│
├── 3d/                               # 3D viewer
│   ├── Viewer3D.vue                 # Main 3D viewer
│   │
│   ├── scene/                       # Components inside TresCanvas
│   │   ├── CameraSetup.vue         # Cameras & OrbitControls
│   │   ├── SceneLighting.vue       # Ambient & directional lights
│   │   ├── SceneHelpers.vue        # Grid, axes helpers
│   │   ├── MeshEditor.vue          # Mesh + transform controls + measurements
│   │   └── ViewportHelpers.vue     # Gizmo & aspect sync
│   │
│   ├── overlays/                    # UI overlays (outside TresCanvas)
│   │   ├── Viewer3DOverlay.vue     # Transform & projection controls
│   │   └── Viewer3DStatusIndicator.vue  # Status messages
│   │
│   ├── controls/                    # UI control widgets
│   │   ├── ProjectionModeSelector.vue   # Perspective/Orthographic toggle
│   │   └── TransformModeSelector.vue    # Translate/Rotate/Scale selector
│   │
│   └── mesh/                        # Mesh-specific components
│       └── MeshMeasurements.vue    # Dimension annotations
│
└── shared/                          # Shared utilities
    ├── ViewerOverlay.vue           # 2D/3D view mode toggle
    ├── ViewerPlaceholder.vue       # Empty state UI
    ├── CameraAspectSync.vue        # Camera aspect ratio synchronization
    └── GizmoSetup.vue              # Viewport orientation gizmo

```

## Component Categories

### Scene Components (`3d/scene/`)
Components that live **inside** TresCanvas and interact with the Three.js scene graph:
- **CameraSetup** - Manages camera switching and controls
- **SceneLighting** - Scene lighting configuration
- **SceneHelpers** - Debug visualization helpers
- **MeshEditor** - Mesh rendering and manipulation
- **ViewportHelpers** - Viewport utilities

### Overlay Components (`3d/overlays/`)
UI components that live **outside** TresCanvas and provide user controls:
- **Viewer3DOverlay** - Main control panel
- **Viewer3DStatusIndicator** - Status notifications

### Control Widgets (`3d/controls/`)
Reusable UI control components:
- **ProjectionModeSelector** - Camera projection toggle
- **TransformModeSelector** - Transform mode selector

### Mesh Components (`3d/mesh/`)
Mesh-specific visualization and annotation:
- **MeshMeasurements** - Dimension indicators

### Shared Components (`shared/`)
Components used across 2D and 3D viewers:
- **ViewerOverlay** - View mode switcher
- **ViewerPlaceholder** - Empty state
- **CameraAspectSync** - Aspect ratio utility
- **GizmoSetup** - Viewport gizmo utility

## Import Patterns

```javascript
// Main viewers
import Viewer3D from './3d/Viewer3D.vue'
import Viewer2D from './2d/Viewer2D.vue'

// Scene components (inside TresCanvas)
import CameraSetup from './3d/scene/CameraSetup.vue'
import SceneLighting from './3d/scene/SceneLighting.vue'

// UI overlays (outside TresCanvas)
import Viewer3DOverlay from './3d/overlays/Viewer3DOverlay.vue'

// Controls
import ProjectionModeSelector from './3d/controls/ProjectionModeSelector.vue'

// Mesh components
import MeshMeasurements from './3d/mesh/MeshMeasurements.vue'

// Shared utilities
import ViewerOverlay from './shared/ViewerOverlay.vue'
```

## Design Principles

1. **Scene vs UI Separation** - Scene components (inside TresCanvas) vs UI overlays (outside)
2. **Modular by Function** - Clear separation by responsibility
3. **Self-Documenting Paths** - Import paths indicate component purpose
4. **Extensibility** - Easy to add new components in appropriate categories
5. **Reusability** - Shared components promote DRY principles

## Future Extensions

Potential areas for growth:

- `3d/effects/` - Post-processing effects
- `3d/exporters/` - STL, OBJ export dialogs
- `3d/materials/` - Material editors
- `2d/tools/` - Image editing tools
- `2d/filters/` - Image filters
- `shared/utils/` - Shared utility functions

## Notes

- All scene components must be used inside `<TresCanvas>`
- Overlay components use absolute positioning for UI elements
- Shared components work in both 2D and 3D contexts
- Import paths use relative paths for component-to-component imports
