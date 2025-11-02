<template>
  <g :class="{ 'animate-slide-in-right': animate }">
    <path
      id="hill2"
      :fill="fillColor"
      fill-opacity=".99608"
      stroke="#004564"
      stroke-linecap="butt"
      stroke-linejoin="round"
      stroke-opacity=".99608"
      stroke-width=".7"
      d="M18.91458 17.2306v2.43983c0 1.108-.892 2-2 2H2.25c-.5317 0-1.01367-.20541-1.37119-.54153 11.485-2.1289 12.51715-8.52578 18.03577-3.8983Z"
    />
  </g>
</template>

<script setup>
defineProps({
  animate: { type: Boolean, default: false },
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
