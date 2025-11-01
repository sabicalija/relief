<template>
  <div class="transform-mode-selector">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :class="['mode-button', { active: modelValue === mode.value }]"
      :title="mode.label"
      @click="handleModeClick(mode.value)"
    >
      <font-awesome-icon :icon="mode.icon" />
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: "translate",
  },
});

const emit = defineEmits(["update:modelValue"]);

function handleModeClick(modeValue) {
  // Toggle off if clicking the same mode
  if (props.modelValue === modeValue) {
    emit("update:modelValue", null);
  } else {
    emit("update:modelValue", modeValue);
  }
}

const modes = [
  { value: "translate", label: "Move (G)", icon: "arrows-up-down-left-right" },
  { value: "rotate", label: "Rotate (R)", icon: "rotate" },
  { value: "scale", label: "Scale (S)", icon: "maximize" },
];
</script>

<style scoped lang="scss">
@use "@/styles/controls/buttons.scss" as *;

.transform-mode-selector {
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
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
