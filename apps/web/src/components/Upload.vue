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

<style scoped>
.upload {
  margin: 2rem 0;
}

.upload-label {
  display: inline-block;
  padding: 1rem 2rem;
  background-color: #42b983;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

.upload-label:hover {
  background-color: #359268;
}

.file-input {
  display: none;
}
</style>
