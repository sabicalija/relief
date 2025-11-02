/**
 * Viewer status module
 * Manages status messages and indicators across the application
 * Supports queuing multiple status messages with priority handling
 */
import { ref, computed } from "vue";

export function createViewerStatus() {
  // Status queue (priority queue: higher priority shows first)
  const statusQueue = ref([]);
  let nextId = 0;

  /**
   * Current active status (highest priority)
   */
  const currentStatus = computed(() => {
    if (statusQueue.value.length === 0) return null;
    return statusQueue.value[0];
  });

  /**
   * Add a status message to the queue
   * @param {string} message - Status text to display
   * @param {string} icon - FontAwesome icon name (e.g., 'spinner', 'check', 'exclamation-triangle')
   * @param {Object} options - Additional options
   * @param {number} options.priority - Higher priority shows first (default: 0)
   * @param {boolean} options.spin - Whether icon should spin (default: false)
   * @param {number} options.duration - Auto-dismiss after ms (default: null = manual dismiss)
   * @returns {number} Status ID for manual dismissal
   */
  function addStatus(message, icon, options = {}) {
    const id = nextId++;
    const status = {
      id,
      message,
      icon,
      spin: options.spin ?? false,
      priority: options.priority ?? 0,
      duration: options.duration ?? null,
      timestamp: Date.now(),
    };

    // Insert by priority (higher priority first)
    const insertIndex = statusQueue.value.findIndex((s) => s.priority < status.priority);
    if (insertIndex === -1) {
      statusQueue.value.push(status);
    } else {
      statusQueue.value.splice(insertIndex, 0, status);
    }

    // Auto-dismiss if duration specified
    if (status.duration) {
      setTimeout(() => removeStatus(id), status.duration);
    }

    return id;
  }

  /**
   * Remove a status message by ID
   * @param {number} id - Status ID returned by addStatus
   */
  function removeStatus(id) {
    const index = statusQueue.value.findIndex((s) => s.id === id);
    if (index !== -1) {
      statusQueue.value.splice(index, 1);
    }
  }

  /**
   * Clear all status messages
   */
  function clearAll() {
    statusQueue.value = [];
  }

  /**
   * Helper: Show generating status
   */
  function showGenerating(message = "Generating 3D mesh...") {
    return addStatus(message, "spinner", { spin: true, priority: 10 });
  }

  /**
   * Helper: Show success status
   */
  function showSuccess(message, duration = 3000) {
    return addStatus(message, "check", { priority: 5, duration });
  }

  /**
   * Helper: Show error status
   */
  function showError(message, duration = 5000) {
    return addStatus(message, "exclamation-triangle", { priority: 100, duration });
  }

  return {
    // State
    statusQueue,
    currentStatus,

    // Actions
    addStatus,
    removeStatus,
    clearAll,

    // Helpers
    showGenerating,
    showSuccess,
    showError,
  };
}
