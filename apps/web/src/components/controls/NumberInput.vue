<template>
  <div class="control-group">
    <label>
      {{ label }}
    </label>
    <input
      v-model.number="localValue"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      class="number-input"
    />
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: [Number, String],
  label: String,
  min: [Number, String],
  max: [Number, String],
  step: [Number, String],
  placeholder: String,
  hint: String,
});

const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue);

const debouncedEmit = useDebounceFn((value) => {
  emit("update:modelValue", value);
}, 500);

watch(localValue, debouncedEmit);
watch(
  () => props.modelValue,
  (val) => {
    if (val !== localValue.value) localValue.value = val;
  }
);
</script>

<style lang="scss" scoped>
@use "../../styles/controls/forms" as *;
@use "../../styles/controls/labels" as *;

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

label {
  @include label-base;
}

.number-input {
  @include input-base;
}

.hint {
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.6);
}
</style>
