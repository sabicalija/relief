<template>
  <g :class="{ 'animate-drop': animate }">
    <defs>
      <radialGradient id="rg-balloon-body" :cx="gradientCenter.cx" :cy="gradientCenter.cy" r="4">
        <stop offset="0" stop-color="#f9b063" />
        <stop offset="1" stop-color="#ec3936" />
      </radialGradient>
      <radialGradient id="rg-balloon-shadow" :cx="gradientCenter.cx" :cy="gradientCenter.cy" r="4">
        <stop offset="1" stop-color="#fbb886" />
        <stop offset="0" stop-color="#fae6d1" />
      </radialGradient>
      <radialGradient id="rg-balloon-reflection" :cx="gradientCenter.cx" :cy="gradientCenter.cy" r="8">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#ec3936" />
      </radialGradient>
    </defs>
    <g id="hot-air-balloon">
      <path
        id="balloon-body"
        fill="red"
        d="M 39 55 l -5 0 c -1 -4 -5 -5 -5 -10 c 0 -8 5 -10 10 -10 c 5 0 10 2 10 10 c 0 5 -4 6 -5 10 z"
      />
      <circle id="balloon-shadow" cx="37" cy="43" r="8" fill="var(--logo-balloon-orange)" />
      <ellipse
        id="balloon-reflection"
        style="transform: rotate(35deg); transform-origin: 37px 40px"
        cx="37"
        cy="40"
        rx="1.5"
        ry="2"
        fill="var(--logo-balloon-yellow)"
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
defineProps({
  animate: { type: Boolean, default: false },
  gradientCenter: { type: Object, default: () => ({ cx: 10, cy: 5 }) },
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
