<template>
  <Transition name="fade">
    <div v-if="statusStore.currentStatus" class="viewer-status-indicator">
      <font-awesome-icon :icon="statusStore.currentStatus.icon" :spin="statusStore.currentStatus.spin" />
      <span>{{ statusStore.currentStatus.message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { useViewerStatusStore } from "../../stores/viewerStatus";

const statusStore = useViewerStatusStore();
</script>

<style scoped lang="scss">
.viewer-status-indicator {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 0.875rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  backdrop-filter: blur(4px);
  z-index: 100; // Above canvas

  svg {
    width: 14px;
    height: 14px;
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
