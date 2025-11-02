<template>
  <g :class="{ 'animate-drop': animate }">
    <defs>
      <radialGradient
        id="rg-balloon-body"
        :cx="gradientCenter.cx"
        :cy="gradientCenter.cy"
        r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="var(--logo-gradient-body-inner)" />
        <stop offset="1" stop-color="var(--logo-gradient-body-outer)" />
      </radialGradient>
      <radialGradient
        id="rg-balloon-shadow"
        :cx="gradientCenter.cx"
        :cy="gradientCenter.cy"
        r="30"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="var(--logo-gradient-shadow-inner)" stop-opacity="0.2" />
        <stop offset="1" stop-color="var(--logo-gradient-shadow-outer)" stop-opacity="0" />
      </radialGradient>
      <radialGradient
        id="rg-balloon-reflection"
        :cx="gradientCenter.cx"
        :cy="gradientCenter.cy"
        r="15"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stop-color="var(--logo-gradient-reflection-inner)" stop-opacity="0.75" />
        <stop offset="1" stop-color="var(--logo-gradient-reflection-outer)" stop-opacity="0.05" />
      </radialGradient>
    </defs>
    <g id="hot-air-balloon">
      <path
        id="balloon-body"
        fill="url(#rg-balloon-body)"
        d="M 39 55 l -5 0 c -1 -4 -5 -5 -5 -10 c 0 -8 5 -10 10 -10 c 5 0 10 2 10 10 c 0 5 -4 6 -5 10 z"
      />
      <circle
        id="balloon-shadow"
        cx="38"
        cy="44"
        r="8"
        fill="url(#rg-balloon-shadow)"
        :style="`transform: translate(${isHovering ? reflectionOffset.x / 2 : 0}px, ${
          isHovering ? reflectionOffset.y / 2 : 0
        }px);`"
      />
      <ellipse
        id="balloon-reflection"
        :style="`transform: translate(${reflectionOffset.x / 2}px, ${0 * reflectionOffset.y}px);`"
        cx="37"
        cy="40"
        rx="1.5"
        ry="2"
        fill="url(#rg-balloon-reflection)"
      />
      <path
        id="balloon-outline"
        fill="none"
        stroke="var(--logo-stroke)"
        stroke-width="var(--logo-stroke-width)"
        d="M 39 55 l -5 0 c -1 -4 -5 -5 -5 -10 c 0 -8 5 -10 10 -10 c 5 0 10 2 10 10 c 0 5 -4 6 -5 10 z"
      />
      <path
        id="rope"
        fill="none"
        stroke="var(--logo-stroke)"
        stroke-width="var(--logo-stroke-width-fine)"
        d="M 35 60 L 34 55 M 43 60 L 44 55 M 39 35 c -5 0 -7 5 -6 10 c 1 5 3 5 4 15 M 39 35 c 5 0 7 5 6 10 c -1 5 -3 5 -4 15 M 29 45 c 0 0 2 1 4 0 c 0 0 6 4 12 0 c 0 0 2 1 4 0"
      />
      <path
        id="basket"
        fill="var(--logo-balloon-basket)"
        stroke="var(--logo-stroke)"
        stroke-width="var(--logo-stroke-width)"
        d="M 35 60 h 8 l -1 6 h -6 z"
      />
    </g>
  </g>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  animate: { type: Boolean, default: false },
  mousePosition: { type: Object, default: () => ({ x: 0, y: 0 }) },
  isHovering: { type: Boolean, default: false },
});

// Balloon bounds in viewBox coordinates
const balloonBounds = {
  minX: 29,
  maxX: 49,
  minY: 35,
  maxY: 66,
};

// Calculate gradient center within balloon bounds based on mouse position
const gradientCenter = computed(() => {
  const cx = balloonBounds.minX + props.mousePosition.x * (balloonBounds.maxX - balloonBounds.minX);
  const cy = balloonBounds.minY + props.mousePosition.y * (balloonBounds.maxY - balloonBounds.minY);
  return { cx, cy };
});

// Calculate reflection position to align with gradient center
// Reflection moves within a small rectangular boundary around the balloon center
const reflectionOffset = computed(() => {
  const balloonCenterX = 37;
  const balloonCenterY = 40;

  // Max offset from center (creates rectangular boundary)
  const maxOffsetX = 2;
  const maxOffsetY = 1.5;

  // Calculate offset toward gradient center
  const dx = gradientCenter.value.cx - balloonCenterX;
  const dy = gradientCenter.value.cy - balloonCenterY;

  // Scale and clamp to max offset
  const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, dx * 0.15));
  const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, dy * 0.15));

  return { x: offsetX, y: offsetY };
});
</script>

<style scoped>
.animate-drop {
  animation: dropIn 0.8s ease-out 1s forwards;
  opacity: 0;
}

@keyframes dropIn {
  0% {
    transform: translateY(-150%);
    opacity: 0;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
