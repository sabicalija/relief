<template>
  <g :class="{ 'animate-slide-in-left': animate }">
    <defs>
      <radialGradient
        id="rg-hill-left"
        :cx="gradientCenter.cx"
        :cy="gradientCenter.cy"
        r="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="var(--logo-gradient-hill-left-inner)" />
        <stop offset="1" stop-color="var(--logo-gradient-hill-left-outer)" />
      </radialGradient>
    </defs>
    <path
      id="hill-left"
      fill="url(#rg-hill-left)"
      stroke="var(--logo-stroke)"
      stroke-width="var(--logo-stroke-width)"
      d="M 70 92 c 0 4 -4 8 -8 8 h -54 c -4 0 -8 -2 -8 -8 v -22 c 26 -18 25 15 70 15 z"
    />
  </g>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  animate: { type: Boolean, default: false },
  mousePosition: { type: Object, default: () => ({ x: 0, y: 0 }) },
});

// Hill bounds in viewBox coordinates (approximate)
const hillBounds = {
  minX: 0,
  maxX: 70,
  minY: 70,
  maxY: 100,
};

// Calculate gradient center within hill bounds based on mouse position
const gradientCenter = computed(() => {
  const cx = hillBounds.minX + props.mousePosition.x * (hillBounds.maxX - hillBounds.minX);
  const cy = hillBounds.minY + props.mousePosition.y * (hillBounds.maxY - hillBounds.minY);
  return { cx, cy };
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
