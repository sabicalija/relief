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

<style scoped>
.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.number-input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 2px solid #d3d3d3;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
}

.number-input:focus {
  border-color: #42b983;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
}
</style>
