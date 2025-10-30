<template>
  <div class="viewer-placeholder">
    <div class="placeholder-icon">
      <font-awesome-icon icon="image" />
    </div>
    <p>No preview available</p>
    <p class="placeholder-hint">Load a depth map to see the preview</p>
    <p class="placeholder-hint">You can also drag & drop an image here</p>
  </div>
</template>

<script setup>
// FontAwesome icon component is globally available
</script>

<style scoped>
.viewer-placeholder {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.viewer-placeholder p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 1.125rem;
}

.placeholder-hint {
  font-size: 0.875rem !important;
  color: #adb5bd !important;
}
</style>
