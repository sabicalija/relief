<template>
  <path
    id="frame"
    fill="none"
    stroke="var(--logo-frame)"
    stroke-width="var(--logo-frame-width)"
    d="M 8 22 h 54 c 4 0 8 4 8 8 v 62 c 0 4 -4 8 -8 8 h -54 c -4 0 -8 -2 -8 -8 v -62 c 0 -4 4 -8 8 -8 z"
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
