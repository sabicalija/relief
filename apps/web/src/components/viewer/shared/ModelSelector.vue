<template>
  <div class="model-selector">
    <div class="selector-row">
      <label :for="`model-variant-${uid}`">Model Quality:</label>
      <select :id="`model-variant-${uid}`" v-model="selectedVariant" class="model-select">
        <option v-for="[key, variant] in availableVariants" :key="key" :value="key">
          {{ variant.name }}
        </option>
      </select>
    </div>
    <span class="model-description">{{ currentVariantDescription }}</span>

    <!-- Backend selector hidden when only one option available -->
    <div v-if="availableBackends.length > 1" class="selector-row">
      <label :for="`execution-backend-${uid}`">Execution Backend:</label>
      <select :id="`execution-backend-${uid}`" v-model="selectedBackend" class="model-select">
        <option v-for="[key, backend] in availableBackends" :key="key" :value="key">
          {{ backend.name }}
        </option>
      </select>
    </div>
    <span v-if="availableBackends.length > 1" class="model-description">{{ currentBackendDescription }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useImageStore } from "@/stores/image";
import { MODEL_VARIANTS, EXECUTION_BACKENDS, getDefaultConfig } from "@/utils/depth";

// Generate unique ID for label associations
const uid = Math.random().toString(36).substring(2, 9);

const imageStore = useImageStore();
const selectedVariant = ref(null);
const selectedBackend = ref(null);

const availableVariants = computed(() => Object.entries(MODEL_VARIANTS));
const availableBackends = computed(() => {
  const backends = EXECUTION_BACKENDS;
  return Object.entries(backends).filter(([key]) => {
    if (key === "webgpu") return false; // Hide WebGPU for stability
    return true;
  });
});

const currentVariantDescription = computed(() => {
  if (!selectedVariant.value) return "";
  const variant = MODEL_VARIANTS[selectedVariant.value];
  return variant ? variant.description : "";
});

const currentBackendDescription = computed(() => {
  if (!selectedBackend.value) return "";
  const backend = EXECUTION_BACKENDS[selectedBackend.value];
  return backend ? backend.description : "";
});

// Initialize with current store values or defaults
onMounted(() => {
  const defaults = getDefaultConfig();
  selectedVariant.value = imageStore.depthModelVariant || defaults.variant;
  selectedBackend.value = imageStore.depthExecutionBackend || defaults.backend;

  // Sync to store
  imageStore.setDepthModelVariant(selectedVariant.value);
  imageStore.setDepthExecutionBackend(selectedBackend.value);
});

// Watch for changes and update store
watch(selectedVariant, (newVariant) => {
  if (newVariant) {
    imageStore.setDepthModelVariant(newVariant);
  }
});

watch(selectedBackend, (newBackend) => {
  if (newBackend) {
    imageStore.setDepthExecutionBackend(newBackend);
  }
});
</script>

<style scoped lang="scss">
.model-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  margin-top: 12px;

  .selector-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text);
      min-width: 100px;
    }

    .model-select {
      flex: 1;
      padding: 0.4rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: white;
      font-size: 0.75rem;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--color-border-hover);
      }

      &:focus {
        outline: none;
        border-color: var(--color-primary);
      }
    }
  }

  .model-description {
    font-size: 0.7rem;
    color: #6c757d;
    font-style: italic;
    text-align: left;
    margin-top: -0.5rem;
    line-height: 1.3;
  }
}
</style>
