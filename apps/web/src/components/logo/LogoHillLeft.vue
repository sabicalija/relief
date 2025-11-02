<template>
  <g :class="{ 'animate-slide-in-left': animate }">
    <path
      id="hill1"
      fill="#08b7ba"
      fill-opacity="1"
      stroke="#004563"
      stroke-linecap="round"
      stroke-opacity="1"
      stroke-width=".6"
      d="M18.91458 19.67043c0 1.108-.892 2-2 2H2.25c-1.108 0-2-.892-2-2v-5.3146c6.19648-3.65349 6.35181 5.11942 18.66458 5.3146z"
    />
  </g>
</template>

<script setup>
defineProps({
  animate: { type: Boolean, default: false },
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
