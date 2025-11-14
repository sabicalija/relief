# Relief - GitHub Copilot Instructions

Relief converts depth maps and images into 3D relief models (STL files) for tactile graphics and 3D printing.

## Tech Stack

- Vue 3 + Vite + Pinia
- TresJS (@tresjs/core, @tresjs/cientos) for declarative Three.js
- Three.js (BufferGeometry, STLExporter)
- Transformers.js (@huggingface/transformers) for browser-based ML inference
- Depth Anything V2 Small model for depth map generation (~25MB)
- SCSS with modern @use syntax
- Vitest for testing
- pnpm workspaces
- Python Flask API (apps/api/) - legacy MiDaS depth service

## Repository Structure

```
apps/
  api/              # Flask depth service (legacy)
  web/              # Vue 3 frontend
    src/
      components/
        viewer/     # Modular viewer components (2D, 3D, overlays, placeholder)
      plugins/      # Vue plugins (icons, etc.)
      stores/       # Pinia state management
      styles/       # Global SCSS (vars.scss, overlays.scss)
      utils/
        image/      # Image processing (depthmap, resampling)
        mesh/       # 3D mesh operations (geometry, STL export)
        depth/      # AI depth estimation (Transformers.js, Depth Anything V2)
```

## Build & Test

Run from `apps/web/`:

```bash
pnpm install          # After pulling package.json changes
pnpm dev              # Dev server at localhost:5173
pnpm build            # Production build to dist/
pnpm preview          # Preview production build
pnpm test             # Run all tests
pnpm test:ui          # Interactive test UI
pnpm test:coverage    # Coverage report
```

## Critical Architecture Rules

### 1. Coordinate System

3D mesh uses Blender's default coordinate system:

```javascript
// Image pixel to 3D mesh coordinates (Blender system)
const meshX = (x / (width - 1)) * meshWidth - meshWidth / 2; // X = width (right)
const meshZ = (y / (height - 1)) * meshHeight - meshHeight / 2; // Z = height (up)
const meshY = depthValue * targetDepthMm; // Y = depth (forward/relief height)

// Camera up vector set to Z-up for Blender compatibility
camera.up.set(0, 0, 1);

// Initial camera position for correct gizmo orientation
const cameraPosition = [150, -150, 150]; // (X, -Y, Z) for Blender default view
```

Rules:

- X-axis = width (horizontal/right, red in Blender)
- Y-axis = depth (forward/relief height, green in Blender)
- Z-axis = height (vertical/up, blue in Blender)
- Camera up must be set to (0,0,1) for correct gizmo orientation
- Camera position [150, -150, 150] aligns view with Blender default
- Mesh is built in final orientation, no rotations applied
- THREE.Object3D.DEFAULT_UP must be set to (0,0,1) in three-setup.js before any other imports

**UI Labels vs Internal Coordinates:**
For user-facing labels in dimension panels, we use intuitive descriptions rather than technical Blender axes:

- Width → "X-axis (horizontal)"
- Height → "Y-axis (vertical)" (even though internally it's Z-axis)
- Depth → "Z-axis (depth)" (even though internally it's Y-axis)
- Base → "Z-axis (below surface)"

This matches standard user expectations where Y is vertical (like in 2D graphics) rather than Blender's Z-up convention.

### 2. Parameter Independence

Physical dimensions are independent - no aspect ratio coupling:

```javascript
// Correct
const meshWidth = targetWidthMm || 100;
const meshHeight = targetHeightMm || 100;
const meshDepth = targetDepthMm || 20;

// Wrong - don't couple via aspect ratio
const meshHeight = targetWidthMm / aspectRatio;
```

### 3. Domain Organization

Separate image processing from 3D mesh operations:

- `utils/image/` - Image processing (depthmap.js, processing.js, index.js)
- `utils/mesh/` - 3D operations (geometry.js, material.js, stl.js, index.js)
- `utils/depth/` - AI depth estimation (estimation.js using Transformers.js)

Import flow: Components import from `mesh/index.js`, which imports from `image/index.js`. This maintains clean boundaries.

### 3.5. Function Exports

Export internal functions for isolated testing when they have complex logic, reusability potential, or edge cases needing separate coverage. Don't export simple helpers (<5 lines) or tightly coupled functions.

### 4. State Management

Pinia store with sub-modules in `stores/image/`:

- state.js - All reactive refs (depthMap, dimensions, config params)
- loaders.js - Image loading (loadDepthMapFromFile, loadDepthMapFromUrl, setDepthMap)
- dimensions.js - Dimension setters (setMaxResolution, setTargetWidthMm/HeightMm)
- mesh.js - Mesh parameters (setTargetDepthMm, setBaseThicknessMm, setSimplificationRatio)
- enhancements.js - Depth enhancement (setEnhanceDetails, strength, threshold, smoothing)
- contour.js - Contour flattening (setEnableContour, setContourThreshold)
- display.js - Display settings (setShowTexture, setBaseColor, texture management)
- depth.js - AI depth generation (generateDepthMapFromImage using Transformers.js)

Main store (`stores/image.js`) composes modules with spread operator for backward-compatible flat API.

**Store Design Principles:**

- Centralize side effects (e.g., dimension extraction) in store methods, not components
- Avoid prop drilling - components access store directly when data already exists in store
- Keep loading logic (FileReader, fetch) in store, not duplicated across components

### 5. Test Organization

Tests colocate with source (`filename.test.js`), mirroring code structure:

```
utils/image/depthmap.test.js      # Depth enhancement algorithms
utils/image/processing.test.js    # Image loading and resampling
utils/mesh/stl.test.js             # STL utility functions
utils/mesh/index.test.js           # Integration tests
```

Split test files when they exceed 500 lines or test multiple unrelated modules.

**Testing Patterns**:

- Use real THREE.js objects (BufferGeometry, Mesh) instead of mocks
- Use `toBeCloseTo(value, precision)` for Float32Array comparisons
- Mock DOM APIs (Image) with `global.Image` including addEventListener/removeEventListener
- Test with `showTexture: false` instead of mocking TextureLoader
- Export internal functions for isolated testing when they have complex logic
- Colocate tests with source files for easy navigation

### 6. TresJS Integration

TresJS provides declarative Three.js components. Critical requirements:

**Vite Config:**

```javascript
import { templateCompilerOptions } from "@tresjs/core";

export default {
  plugins: [vue({ ...templateCompilerOptions })],
  resolve: { dedupe: ["three"] }, // Prevent multiple instances
};
```

**Three.js Reactivity Protection:**
Always use `markRaw()` for Three.js objects - Vue's reactivity breaks them:

```javascript
import { markRaw } from 'vue'
const mesh = markRaw(createMeshFromDepthMap(...))  // Correct
```

**Component Rules:**

- TresCanvas, OrbitControls only work inside TresCanvas
- Use `primitive` component for Three.js objects in template
- Don't use useTresContext outside TresCanvas hierarchy

### 7. SCSS System

Split concerns: CSS custom properties (runtime) vs SCSS mixins (compile-time):

- `styles/vars.scss` - CSS custom properties in :root, imported in main.js
- `styles/overlays.scss` - SCSS mixins only, use via `@use '@/styles/overlays.scss'`

Configure Vite: `css.preprocessorOptions.scss.api: "modern-compiler"`
Use modern `@use` syntax, not deprecated `@import`.

### 8. Plugin Organization

Organize Vue plugins in `src/plugins/`:

- `icons.js` - FontAwesome configuration
- Future: router.js, etc.

Pattern: Export plugin with `install(app)` method, use in main.js with `app.use(plugin)`.

## File Naming

Use descriptive names indicating purpose, not type:

- processing.js (not image.js)
- geometry.js (not mesh.js)
- stl.js (not export.js)

Components: PascalCase .vue files
Utilities: camelCase .js files
Tests: filename.test.js

## Common Mistakes

Don't create refactored copies of files - refactor in place with helper functions above the main export.

Don't couple dimensions via aspect ratio - keep width/height/depth independent.

Don't mix domains - separate image/ from mesh/ utilities.

Don't use generic file names - be specific about purpose.

Don't create monolithic test files - split by module responsibility.

Don't use `toBe()` for Float32Array values - use `toBeCloseTo()` for floating-point precision tolerance.

Don't mock THREE.js constructors with `vi.mock()` - use real objects to avoid hoisting issues.

Don't forget `markRaw()` for Three.js objects - Vue reactivity will corrupt them.

Don't pass events to parent components that don't use them - keep state local when only child needs it.

Don't duplicate image loading logic - centralize FileReader/fetch operations in store methods.

Don't create props for data already in store - components should access store directly to avoid prop drilling.

## Component Organization

Split large components into focused sub-components:

**Legacy Components (avoid for new features):**

- Controls.vue - Legacy parameter controls panel (pre-viewer architecture)
- controls/ - Legacy control components (NumberInput, SimplificationSlider, etc.)

**Modern Viewer Architecture:**

- Upload.vue - File upload button
- Preview.vue - Image preview with drag & drop
- Viewer.vue - Main 3D viewer wrapper
- DemoGallery.vue - Demo image gallery
- viewer/ - Modular viewer components:
  - 2d/Viewer2D.vue - 2D depth map view
  - 3d/Viewer3D.vue - 3D mesh view
  - shared/ViewerOverlay.vue - Top-left overlay (2D/3D toggle, download button)
  - 3d/overlays/Viewer3DOverlay.vue - Bottom-right status indicators
  - 3d/overlays/Viewer3DPanel.vue - Right-side panel with tabs
  - 3d/overlays/panels/ - Panel components:
    - ItemPanel.vue - Transform properties (location, rotation)
    - DimensionsPanel.vue - Physical dimensions
    - MaterialPanel.vue - Color and texture settings
    - QualityPanel.vue - Geometry simplification and mesh statistics
    - ViewPanel.vue - Scene helpers and visibility
  - shared/ViewerPlaceholder.vue - Empty state

**Where to Add New Features:**

- **3D viewer controls** → Add to existing panel in `viewer/3d/overlays/panels/` or create new panel
- **Mesh optimization** → QualityPanel.vue
- **Visual settings** → MaterialPanel.vue or ViewPanel.vue
- **Transform controls** → ItemPanel.vue
- **Global UI** → ViewerOverlay.vue (top-left) or Viewer3DOverlay.vue (bottom-right)
- **Do NOT add to** → Controls.vue or controls/ (legacy components)

**Viewer Architecture:**

- Viewer2D/Viewer3D use `position: absolute`, fill parent 100%
- Overlays self-manage positioning with SCSS mixins
- Viewer.vue handles drag & drop, conditional rendering (v-if for content vs placeholder, v-show for 2D/3D toggle)
- No heading in Viewer.vue - parent decides labeling
- ViewerPlaceholder for empty state (no overlays when no content)
- 3D panel tabs: ItemPanel (cube icon), DimensionsPanel (ruler icon), MaterialPanel (palette icon), QualityPanel (sliders icon), ViewPanel (eye icon)

**Component Data Flow:**

- Avoid unnecessary props when data is in global store (e.g., viewMode, isGenerating for child-only state)
- Remove props/emits when child component only needs data for itself (e.g., ViewerOverlay reads viewMode directly)
- Parent-child events only when parent needs to react to child state changes
- Use local refs for truly local state (e.g., isGenerating in Viewer3D for its overlay)

Drag & drop positioning: dropZone ref must be on parent container to remain active after content loads.

## Git Conventions

Conventional Commits format:

```bash
type: lowercase imperative description

- bullet point details
```

Types: feat, fix, refactor, test, docs, style, chore

Rules: lowercase, imperative mood ("add" not "added"), specific about changes.

## Validation Checklist

Before committing:

1. `pnpm test` - All tests pass
2. `pnpm build` - Build succeeds
3. Check editor for errors
4. Verify in browser (`pnpm dev`)

## Working with AI Agents

**Incremental Changes:**

- Make updates in small, reviewable steps
- Let user evaluate functionality along the way
- Suggest major additions before implementing
- Wait for user agreement on significant refactoring
- Avoid overly complex changes that need step-by-step addressing

**When proposing major changes:**

1. Explain the goal and benefits
2. Outline the steps involved
3. Wait for user approval
4. Implement incrementally with checkpoints

## Documentation Maintenance

This file (copilot-instructions.md) is for AI agents - focus on build commands, architecture rules, and critical patterns.

DEVELOPMENT.md is for humans - design philosophy, detailed patterns, common mistakes with rationale.

README.md is for users - quick start, project overview, installation.

When adding patterns:

1. Decide audience: AI agent or human developer?
2. AI patterns go here (copilot-instructions.md) - must be actionable
3. Design decisions go in DEVELOPMENT.md - include rationale
4. User-facing info goes in README.md

Update this file when:

- New build/test commands added
- Critical architecture rules change
- File structure changes significantly
- Common mistakes become patterns

Update DEVELOPMENT.md when:

- Design decisions are made
- New patterns emerge
- Common mistakes need explanation

Update README.md when:

- Setup process changes
- New features for end users
- Installation requirements change

Keep all three files consistent - if you change architecture in code, update all relevant docs in the same commit.

## References

- DEVELOPMENT.md - Design philosophy and detailed patterns
- Three.js docs: https://threejs.org/docs/
- TresJS docs: https://tresjs.org/
- Vue 3 docs: https://vuejs.org/
- Pinia docs: https://pinia.vuejs.org/
