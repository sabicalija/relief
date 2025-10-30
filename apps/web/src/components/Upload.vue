<template>
  <div class="upload">
    <label for="image-upload" class="upload-label">Upload</label>
    <input id="image-upload" type="file" accept="image/*" @change="handleFileUpload" class="file-input" />
  </div>
</template>

<script setup>
import { useImageStore } from "../stores/image";

const imageStore = useImageStore();

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageStore.setDepthMap(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }
};
</script>

<style scoped lang="scss">
@use "../styles/controls/buttons" as *;

.upload {
  margin: var(--spacing-xl) 0;
}

.upload-label {
  @include btn-preset;
  display: inline-block;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
  background: var(--color-primary);

  &:hover {
    background: var(--color-primary-dark);
  }
}

.file-input {
  display: none;
}
</style>
