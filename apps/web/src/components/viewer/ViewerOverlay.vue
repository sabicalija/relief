<template>
  <div class="viewer-overlay">
    <!-- View Mode Toggle -->
    <div class="view-mode-toggle">
      <button
        @click="$emit('update:viewMode', '2d')"
        :class="['toggle-btn', { active: viewMode === '2d' }]"
        title="View depth map"
      >
        2D
      </button>
      <button
        @click="$emit('update:viewMode', '3d')"
        :class="['toggle-btn', { active: viewMode === '3d' }]"
        title="View 3D model"
      >
        3D
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  viewMode: {
    type: String,
    required: true,
  },
});

defineEmits(["update:viewMode"]);
</script>

<style scoped>
.viewer-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.view-mode-toggle {
  display: flex;
  gap: 0.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  background-color: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.toggle-btn.active {
  background-color: #3b82f6;
  color: white;
}
</style>
