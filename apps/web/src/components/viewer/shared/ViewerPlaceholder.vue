<template>
  <div class="viewer-placeholder">
    <div class="placeholder-icon">
      <font-awesome-icon icon="image" />
    </div>
    <p>No preview available.</p>
    <p class="placeholder-hint">Load a depth map to see the preview.</p>
    <p class="placeholder-hint">You can also drag & drop an image here.</p>

    <label for="placeholder-upload" class="upload-button">
      <font-awesome-icon icon="upload" />
      Choose File
    </label>
    <input id="placeholder-upload" type="file" accept="image/*" @change="handleFileUpload" class="file-input" />
  </div>
</template>

<script setup>
import { useImageStore } from "@/stores/image";
import { useViewerStore } from "@/stores/viewer";

const imageStore = useImageStore();
const viewerStore = useViewerStore();

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    // Show loading status immediately before file reading starts
    const statusId = viewerStore.showGenerating("Loading depth map...");

    try {
      await imageStore.loadDepthMapFromFile(file);
    } finally {
      // Remove loading status - mesh generation watcher will show its own status
      viewerStore.removeStatus(statusId);
    }
  }
};
</script>

<style scoped>
.viewer-placeholder {
  width: 100%;
  height: 100vh;
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
  margin-block: 0;
}

.upload-button {
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-primary-dark);
  }
}

.file-input {
  display: none;
}
</style>
