# Composables

Vue 3 composables for reusable reactive logic.

## What are Composables?

Composables are functions that use Vue Composition API (refs, computed, watch, etc.) to encapsulate and reuse stateful logic across components.

## Naming Convention

All composables use the `use*` prefix:
- `useMeshGeneration.js`
- `useCameraState.js`
- `useSTLExport.js`

## When to Create a Composable

Create a composable when you have:
- Reactive state (refs, computed) used across multiple components
- Complex watchers or lifecycle logic to reuse
- Business logic that needs Vue reactivity but should be testable independently

## When NOT to Use Composables

Use `utils/` instead for:
- Pure functions without Vue dependencies
- Synchronous transformations (image processing, geometry calculations)
- Library wrappers without reactive state

## Example Structure

```javascript
// composables/useMeshGeneration.js
import { ref, computed, watch } from 'vue'

export function useMeshGeneration(options) {
  // Internal reactive state
  const mesh = ref(null)
  const isGenerating = ref(false)
  
  // Computed properties
  const hasActiveMesh = computed(() => mesh.value !== null)
  
  // Methods
  function generateMesh(depthMap) {
    // Implementation
  }
  
  // Watchers (if needed)
  watch(/* ... */)
  
  // Expose public API
  return {
    mesh,
    isGenerating,
    hasActiveMesh,
    generateMesh
  }
}
```

## Testing

Composables can be tested in isolation:

```javascript
import { useMeshGeneration } from './useMeshGeneration'

describe('useMeshGeneration', () => {
  it('should generate mesh from depth map', async () => {
    const { mesh, generateMesh } = useMeshGeneration(config)
    await generateMesh(depthMap)
    expect(mesh.value).toBeTruthy()
  })
})
```
