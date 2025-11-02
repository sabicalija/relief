<template>
  <g :class="{ 'animate-slide-in-right': animate }">
    <defs>
      <radialGradient
        id="rg-hill-right"
        :cx="gradientCenter.cx"
        :cy="gradientCenter.cy"
        r="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="var(--logo-gradient-hill-right-inner)" />
        <stop offset="1" stop-color="var(--logo-gradient-hill-right-outer)" />
      </radialGradient>
    </defs>
    <path
      id="hill-right"
      fill="url(#rg-hill-right)"
      stroke="var(--logo-stroke)"
      stroke-width="var(--logo-stroke-width)"
      d="M 70 92 c 0 4 -4 8 -8 8 h -54 c -4 0 -8 -2 -8 -8 c 41 0 42 -27 70 -15 z"
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
