<template>
  <div class="projection-mode-selector">
    <!-- Camera reset button -->
    <button class="mode-button reset-button" title="Reset Camera (Home)" @click="handleResetCamera" tabindex="7">
      <font-awesome-icon icon="camera-rotate" />
    </button>

    <!-- Projection mode buttons -->
    <button
      v-for="(mode, index) in modes"
      :key="mode.value"
      :class="['mode-button', { active: modelValue === mode.value }]"
      :title="mode.label"
      :tabindex="8 + index"
      @click="handleClick(mode.value)"
    >
      <font-awesome-icon :icon="mode.icon" />
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: "perspective",
    validator: (value) => ["perspective", "orthographic"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "reset-camera"]);

function handleClick(value) {
  emit("update:modelValue", value);
}

function handleResetCamera() {
  emit("reset-camera");
}

const modes = [
  { value: "perspective", label: "Perspective View", icon: "cube" },
  { value: "orthographic", label: "Orthographic View", icon: "square" },
];
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons.scss" as *;

.projection-mode-selector {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  width: fit-content;
}

.mode-button {
  @include btn-icon;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: var(--color-blue-500, #4a90e2);
    border-color: var(--color-blue-500, #4a90e2);
    color: white;
  }

  &.active:hover:not(:disabled) {
    background: var(--color-blue-600, #357abd);
    border-color: var(--color-blue-600, #357abd);
  }

  svg {
    width: 18px;
    height: 18px;
  }
}
</style>
