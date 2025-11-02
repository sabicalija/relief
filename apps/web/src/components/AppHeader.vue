<template>
  <div class="header-wrapper" :class="{ collapsed: isCollapsed }" ref="headerWrapperRef">
    <header class="app-header">
      <div class="brand">
        <Logo class="logo" :size="56" decorative />
        <div class="brand-text">
          <h1>Relief</h1>
          <p class="subtitle">
            Schauen tut man mit den <span class="strikethrough">Augen</span> <span class="replacement">Händen</span>.
          </p>
        </div>
      </div>
    </header>
    <button
      class="toggle-button"
      :class="{ collapsed: isCollapsed }"
      @click="isCollapsed = !isCollapsed"
      title="Toggle header"
    >
      <font-awesome-icon :icon="['fas', isCollapsed ? 'angles-down' : 'angles-up']" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import Logo from "./Logo.vue";

const isCollapsed = ref(false);
const headerWrapperRef = ref(null);

// Update CSS variable for header height
function updateHeaderHeight() {
  if (headerWrapperRef.value) {
    const height = isCollapsed.value ? 0 : headerWrapperRef.value.offsetHeight;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
  }
}

// Watch for collapse state changes and update CSS variable
watch(
  isCollapsed,
  () => {
    updateHeaderHeight();
  },
  { flush: "post" }
);

onMounted(() => {
  updateHeaderHeight();
  // Update on window resize
  window.addEventListener("resize", updateHeaderHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateHeaderHeight);
  document.documentElement.style.setProperty("--header-height", "0px");
});
</script>

<style scoped>
.header-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  transition: transform 0.3s ease-in-out;
  transform: translateY(0);
}

.header-wrapper.collapsed {
  transform: translateY(-100%);
}

.app-header {
  padding: 1rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.brand .logo {
  flex: 0 0 auto;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 1rem;
  color: #6c757d;
  font-style: italic;
  margin: 0;
}

.strikethrough {
  text-decoration: line-through;
  color: #adb5bd;
}

.replacement {
  color: var(--color-primary);
  font-weight: 600;
}

.toggle-button {
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0 0 8px 8px;
  border-top: none;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  pointer-events: auto;
  color: #6c757d;
  font-size: 1rem;
  transition: color 0.2s, background 0.2s;
  z-index: 101;
}

.toggle-button:hover {
  color: var(--color-primary);
  background: rgba(255, 255, 255, 1);
}
</style>
