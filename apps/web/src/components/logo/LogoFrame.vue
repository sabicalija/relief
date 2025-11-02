<template>
  <rect
    id="frame"
    width="18.66458"
    height="20.42043"
    x=".25"
    y="1.25"
    fill="none"
    fill-opacity=".99608"
    stroke="#004563"
    stroke-dasharray="none"
    stroke-linecap="round"
    stroke-opacity="1"
    stroke-width="1"
    display="inline"
    ry="2"
    :class="{ 'animate-fade-in': animate }"
  />
</template>

<script setup>
defineProps({
  strokeColor: { type: String, default: "#004563" },
  animate: { type: Boolean, default: false },
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out 0.8s forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
