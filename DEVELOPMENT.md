# Relief - Development Guide

> **"In der Kürze liegt die Würze"** (Brevity is the soul of wit)

This guide documents design decisions, patterns, and common mistakes for human developers. For build/test commands, see [copilot-instructions.md](.github/copilot-instructions.md).

## Design Philosophy

Relief creates tactile graphics - physical objects you experience by touch. This fundamental purpose drives our design:

1. **Accessibility First**: Physical dimensions matter more than visual appearance
2. **Direct Control**: Users set width/height/depth independently - no hidden coupling
3. **Simplicity**: Intuitive controls over complex features
4. **Explicitness**: Clear, verbose code over clever tricks
5. **Modularity**: Focused modules, but keep related code together

## Architecture Decisions

### Domain Separation: Image vs Mesh

**Decision**: Split utilities by domain (image processing vs 3D mesh operations), not by technology.

**Rationale**: 
- Image and mesh operations are separate concerns
- Makes dependencies explicit
- Easier to find and modify related functionality

**Structure**:
```
utils/
  ├── image/           # Pure image processing
  │   ├── depthmap.js       # Depth enhancement algorithms
  │   ├── processing.js     # Image loading, resampling, pixel extraction
  │   └── index.js          # Barrel export
  │
  └── mesh/            # 3D mesh and STL operations
      ├── geometry.js       # Mesh geometry building
      ├── material.js       # THREE.js materials
      ├── stl.js            # STL export and download
      └── index.js          # Main orchestrator, imports from image/
```

**Import Flow**:
```
Components → mesh/index.js → image/index.js
                  ↓
              (orchestration)
```

### The Coordinate System

**Decision**: X/Y/Z map to width/height/depth with single -90° rotation.

**Rationale**:
- Intuitive mapping: pixel coordinates directly translate to 3D space
- Single rotation is easier to reason about than complex transforms
- Negative Z-scaling causes confusion and breaks intuition

**The Mapping**:
```javascript
// Before rotation:
// - X axis = image width (left-right)
// - Y axis = image height (top-bottom)  
// - Z axis = depth (relief height)

const x = (j / segmentsX) * meshWidth - meshWidth / 2;
const y = (i / segmentsY) * meshHeight - meshHeight / 2;
const z = depthValue * targetDepthMm;

// Final orientation: rotate -90° around X to lay flat
mesh.rotation.x = -Math.PI / 2;
```

**Why this matters**: Users expect to control width, height, and depth independently. Complex rotations or aspect ratio coupling break this intuition.

### Parameter Independence

**Decision**: Width, height, and depth are completely independent parameters.

**Rationale**: 
- Users create physical objects with specific dimensions
- Aspect ratio coupling is a visual-first mindset
- Tactile graphics need custom sizing for different contexts

**Example**:
```javascript
// ✅ Independent control
targetWidthMm: 150   // User sets width
targetHeightMm: 200  // User sets height independently
targetDepthMm: 25    // User sets depth independently

// ❌ Aspect ratio coupling (don't do this)
targetHeightMm = targetWidthMm / aspectRatio  // Violates independence
```

### File Naming: Descriptive Over Generic

**Decision**: Use descriptive file names that indicate purpose, not content type.

**Rationale**:
- `processing.js` is clearer than `image.js` (image what? loading? editing?)
- `geometry.js` is clearer than `mesh.js` (mesh what? building? exporting?)
- Reduces cognitive load when navigating codebase

**Pattern**:
```
❌ Generic:          ✅ Descriptive:
image.js             processing.js    (what it does)
mesh.js              geometry.js      (what it does)
export.js            stl.js           (what format)
```

### Test Organization

**Decision**: Tests mirror code structure and live alongside source files.

**Rationale**:
- Easy to find tests for specific functionality
- Encourages testing as you code
- Clear what's tested vs untested

**Pattern**:
```
depthmap.js          → depthmap.test.js      (34 tests)
processing.js        → processing.test.js    (61 tests)
stl.js              → stl.test.js           (13 tests)
index.js (orchestrator) → index.test.js     (27 integration tests)
```

**When to split test files**:
- File > 500 lines
- Testing multiple unrelated modules
- Hard to find specific tests

### Refactoring: In-Place Over New Files

**Decision**: Refactor within existing files using helper functions, don't create new files.

**Rationale**:
- Avoids file proliferation
- Keeps related code together
- Simpler git history

**Pattern**:
```javascript
// ❌ Don't create:
stl.js
stl-refactored.js
stl-helpers.js

// ✅ Do refactor in place:
// In stl.js:
function helper1() { /* ... */ }
function helper2() { /* ... */ }

export async function mainFunction() {
  helper1();
  helper2();
}
```

## Common Mistakes

### 1. Coupling Dimensions via Aspect Ratio

**Mistake**:
```javascript
const aspectRatio = imageWidth / imageHeight;
const meshHeight = meshWidth / aspectRatio;
```

**Why it's wrong**: Users lose independent control of dimensions.

**Correct**:
```javascript
const meshWidth = targetWidthMm || 100;
const meshHeight = targetHeightMm || 100;
```

### 2. Complex Rotation Instead of Simple Mapping

**Mistake**:
```javascript
mesh.rotation.x = Math.PI;
mesh.rotation.y = Math.PI;
mesh.scale.z = -1;
```

**Why it's wrong**: Confusing, breaks intuition, harder to debug.

**Correct**:
```javascript
mesh.rotation.x = -Math.PI / 2;  // Single clear rotation
```

### 3. Mixing Domains in Utilities

**Mistake**:
```
utils/stl/
  ├── image.js      # Image processing in wrong location
  ├── depthmap.js   # Also image processing
  └── export.js     # STL export
```

**Why it's wrong**: Image processing is a different domain from 3D/STL operations.

**Correct**:
```
utils/
  ├── image/        # All image processing
  └── mesh/         # All 3D/STL operations
```

### 4. Creating Monolithic Test Files

**Mistake**: One 1772-line test file for all functions.

**Why it's wrong**: Hard to navigate, slow to run specific tests, unclear what's tested.

**Correct**: Split by module (depthmap.test.js, processing.test.js, etc.)

### 5. Generic File Names

**Mistake**: `image.js`, `mesh.js`, `export.js`

**Why it's wrong**: Ambiguous - image what? mesh what? export what?

**Correct**: `processing.js`, `geometry.js`, `stl.js`

### 6. Forgetting markRaw() for Three.js Objects

**Mistake**:
```javascript
const mesh = createMeshFromDepthMap(...);  // Vue will wrap in Proxy
scene.add(mesh);  // Three.js breaks with proxied objects
```

**Why it's wrong**: Vue's reactivity system wraps objects in Proxy. Three.js expects plain objects and fails with proxies.

**Correct**:
```javascript
import { markRaw } from 'vue';
const mesh = markRaw(createMeshFromDepthMap(...));  // Prevent reactivity
scene.add(mesh);
```

## Code Patterns

### Drag & Drop Implementation

Components that accept file uploads should support drag & drop:

```vue
<script setup>
const isDragging = ref(false);

const handleDragEnter = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragOver = (e) => {
  e.preventDefault();  // Required for drop to work
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
};

// Shared logic for both click and drop
function processFile(file) {
  // Handle file upload
}
</script>

<template>
  <div
    @dragenter="handleDragEnter"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    :class="{ 'drag-over': isDragging }"
  >
    <!-- Content -->
  </div>
</template>

<style scoped>
.drag-over {
  transform: scale(1.02);
  filter: brightness(1.05);
}

.drag-over::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 3px solid #4caf50;
  border-radius: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
```

**Where to use**: `Preview.vue` (not `Upload.vue` - Upload is just a button).

### State Management with Pinia Sub-Modules

Large stores should be split into focused sub-modules using composable functions:

```javascript
// stores/image.js - Main store composes modules
import { defineStore } from 'pinia';
import { createImageState } from './image/state.js';
import { createLoaders } from './image/loaders.js';
// ... other modules

export const useImageStore = defineStore('image', () => {
  const state = createImageState();
  const loaders = createLoaders(state);
  // ... other action groups
  
  return {
    ...state,      // Flatten state
    ...loaders,    // Flatten actions
    // ...
  };
});
```

See [copilot-instructions.md](.github/copilot-instructions.md#4-state-management) for the complete module structure and design principles

### Component Organization

Split large components into focused sub-components:

```
components/
  ├── Upload.vue          # Simple upload button
  ├── Preview.vue         # Image preview + drag & drop
  ├── Viewer.vue          # Main viewer wrapper
  ├── Controls.vue        # Controls panel
  ├── controls/           # Individual controls
  │   ├── DepthEnhancement.vue
  │   └── ContourFlattening.vue
  └── viewer/             # Viewer sub-components
      ├── Viewer2D.vue
      ├── Viewer3D.vue
      ├── ViewerOverlay.vue
      ├── Viewer3DOverlay.vue
      └── ViewerPlaceholder.vue
```

**Rule**: If a component exceeds ~300 lines, consider splitting by responsibility.

### Three.js with Vue Reactivity

**Critical**: Always wrap Three.js objects with `markRaw()` to prevent Vue's reactivity system from corrupting them:

```javascript
import { markRaw } from 'vue';

// ✅ Correct - prevents Vue reactivity
const mesh = markRaw(createMeshFromDepthMap(...));
scene.add(mesh);

// ❌ Wrong - Vue will proxy the mesh and break Three.js
const mesh = createMeshFromDepthMap(...);
scene.add(mesh);  // Will cause errors
```

**Why**: Vue's reactivity wraps objects in Proxy instances. Three.js expects plain objects and breaks when given proxies.

### SCSS Patterns

Modern SCSS organization with separate concerns:

```
styles/
├── vars.scss        # CSS custom properties (:root), imported in main.js
└── overlays.scss    # SCSS mixins only, imported via @use
```

**Usage**:
```scss
// vars.scss - Runtime variables
:root {
  --overlay-primary: #3b82f6;
  --overlay-spacing: 1rem;
}

// overlays.scss - Compile-time mixins
@mixin overlay-base {
  pointer-events: none;
}

// Component.vue
<style scoped>
@use '@/styles/overlays.scss' as overlays;

.my-overlay {
  @include overlays.overlay-base;
  color: var(--overlay-primary);  // Use runtime variable
}
</style>
```

**Rule**: Use modern `@use` syntax, not deprecated `@import`.

### CSS/SCSS Conventions

- Use SCSS files in `styles/` directory
- Split runtime variables (vars.scss) from compile-time mixins (overlays.scss)
- Use modern `@use` syntax instead of deprecated `@import`
- Use BEM-like naming: `.component-name`, `.component-name__element`, `.component-name--modifier`
- Keep styles scoped to components when possible
- Use CSS custom properties for theme colors

## Git Conventions

### Conventional Commits

```bash
type: lowercase imperative description

- bullet point details
- more details
```

**Types**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `style:`, `chore:`

**Rules**:
- Lowercase type and description
- Imperative mood ("add" not "added")
- Specific about what changed and why

**Examples**:
```bash
feat: add drag and drop support to preview component

refactor: reorganize utilities into image/ and mesh/ directories
- separate image processing from 3D operations
- rename files for clarity
- update all imports

test: split monolithic test file into module-specific tests
- create depthmap.test.js (34 tests)
- create processing.test.js (61 tests)
- all 137 tests passing
```

### Branch Strategy

- `main` - Production-ready code
- `feature/description` or `issue-number-description` - Feature branches
- Example: `feature/16-bit-support`

### When to Commit

- After completing a logical unit of work
- Before major refactoring
- When switching tasks
- At user request

## Questions to Ask

When working on Relief, ask yourself:

- **Does this affect the coordinate system?** → Maintain X/Y/Z mapping carefully
- **Does this couple parameters?** → Keep width/height/depth independent
- **Should this be a new file?** → Probably not - refactor in place
- **Will users understand this control?** → Label clearly, add hints
- **Does this work for tactile graphics?** → Consider physical output
- **Is this file getting too large?** → Consider splitting (>300 lines = review)
- **Are tests hard to find?** → Split test file to match code modules
- **Does the file name reflect its purpose?** → Use descriptive names
- **Are we mixing domains?** → Separate image from mesh operations
- **Do we need a barrel export?** → Use index.js for clean public API

## Useful Context

- **Image dimensions**: Example 756×1008 pixels
- **Default STL size**: 100mm × 100mm × 20mm (width × height × depth)
- **Base thickness**: 10mm solid base below relief
- **Mesh resolution**: Configurable segments (default tied to image size)
- **Export format**: Binary STL with material groups (top surface textured, walls/bottom solid)

## Maintaining This Guide

### When to Update

Update this guide when:
- New patterns emerge that should be repeated
- Common mistakes appear multiple times
- Architecture decisions change
- New best practices are established

### Contradiction Detection

If a request contradicts these guidelines:
1. Point it out - don't silently proceed
2. Quote the relevant guideline
3. Ask for clarification
4. Confirm before proceeding

### Proposing New Patterns

If you notice a pattern worth documenting:
1. Suggest adding it to this guide
2. Explain why it's helpful
3. Propose the wording

## References

- [GitHub Copilot Instructions](.github/copilot-instructions.md) - Build/test commands for AI
- [Three.js Documentation](https://threejs.org/docs/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
