<template>
  <path
    id="hill-left"
    fill="var(--logo-hill-left)"
    stroke="var(--logo-stroke)"
    stroke-width="var(--logo-stroke-width)"
    d="M 70 92 c 0 4 -4 8 -8 8 h -54 c -4 0 -8 -2 -8 -8 v -22 c 26 -18 25 15 70 15 z"
    :class="{ 'animate-slide-in-left': animate }"
  />
</template>

<script setup>
defineProps({
  animate: { type: Boolean, default: false },
  gradientCenter: { type: Object, default: () => ({ cx: 9.83, cy: 5.5 }) },
  fillColor: { type: String, default: "#08b7ba" },
  strokeColor: { type: String, default: "#004563" },
});
</script>

<style scoped>
.animate-slide-in-left {
  animation: slideInLeft 0.4s ease-out forwards;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
