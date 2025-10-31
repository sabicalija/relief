<template>
  <div class="projection-mode-selector">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="['mode-button', { active: modelValue === mode.value }]"
      :title="mode.label"
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

const emit = defineEmits(["update:modelValue"]);

function handleClick(value) {
  emit("update:modelValue", value);
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
  width: fit-content; // Only as wide as 2 buttons + padding
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
