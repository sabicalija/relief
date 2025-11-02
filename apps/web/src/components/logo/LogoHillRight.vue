<template>
  <path
    id="hill-right"
    fill="var(--logo-hill-right)"
    stroke="var(--logo-stroke)"
    stroke-width="var(--logo-stroke-width)"
    d="M 70 92 c 0 4 -4 8 -8 8 h -54 c -4 0 -8 -2 -8 -8 c 41 0 42 -27 70 -15 z"
    :class="{ 'animate-slide-in-right': animate }"
  />
</template>

<script setup>
defineProps({
  animate: { type: Boolean, default: false },
  gradientCenter: { type: Object, default: () => ({ cx: 9.83, cy: 5.5 }) },
  fillColor: { type: String, default: "var(--color-primary)" },
  strokeColor: { type: String, default: "#004564" },
});
</script>

<style scoped>
.animate-slide-in-right {
  animation: slideInRight 0.4s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
