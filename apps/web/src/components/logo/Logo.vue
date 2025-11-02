<template>
  <!-- Inline SVG so CSS variables and theming work everywhere -->
  <svg
    id="logo"
    :width="size"
    :height="size"
    viewBox="0 0 70 100"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :aria-labelledby="decorative ? undefined : titleId"
    :aria-hidden="decorative ? 'true' : 'false'"
    role="img"
    preserveAspectRatio="xMidYMid meet"
    :style="primaryColor ? { ['--color-primary']: primaryColor } : undefined"
    class="logo-svg"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <title v-if="!decorative" :id="titleId">{{ title }}</title>
    <LogoHillLeft :animate="animateOnMount" :mouse-position="mousePosition" />
    <LogoHillRight :animate="animateOnMount" :mouse-position="mousePosition" />
    <LogoFrame :animate="animateOnMount" />
    <LogoBalloon :animate="animateOnMount" :mouse-position="mousePosition" :is-hovering="isHovering" />
  </svg>
</template>

<script setup>
import { ref, onMounted } from "vue";
import LogoFrame from "./LogoFrame.vue";
import LogoHillLeft from "./LogoHillLeft.vue";
import LogoHillRight from "./LogoHillRight.vue";
import LogoBalloon from "./LogoBalloon.vue";

const props = defineProps({
  size: { type: [Number, String], default: 128 },
  title: { type: String, default: "Relief logo" },
  decorative: { type: Boolean, default: false },
  primaryColor: { type: String, default: "" }, // optional override for --color-primary
  animate: { type: Boolean, default: true }, // Enable page-load animations
});

const titleId = `logo-title-${Math.random().toString(36).slice(2)}`;
const animateOnMount = ref(false);
const mousePosition = ref({ x: 0, y: 0 }); // Normalized mouse position (0-1)
const targetMousePosition = ref({ x: 0, y: 0 }); // Target position for smooth animation
const isHovering = ref(false);

// Smoothly animate mouse position toward target
let animationFrame = null;
function animateMousePosition() {
  const current = mousePosition.value;
  const target = targetMousePosition.value;

  // Lerp (linear interpolation) with easing factor
  const easeFactor = 0.15;
  const dx = target.x - current.x;
  const dy = target.y - current.y;

  // Update position
  mousePosition.value = {
    x: current.x + dx * easeFactor,
    y: current.y + dy * easeFactor,
  };

  // Continue animating if not close enough to target
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 0.001) {
    animationFrame = requestAnimationFrame(animateMousePosition);
  } else {
    animationFrame = null;
  }
}

// Handle mouse movement to update normalized mouse position
function handleMouseMove(event) {
  isHovering.value = true;

  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();

  // Calculate normalized mouse position (0-1 range)
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;

  targetMousePosition.value = { x, y };

  // Start animation if not already running
  if (!animationFrame) {
    animateMousePosition();
  }
}

// Reset to default position when mouse leaves
function handleMouseLeave() {
  isHovering.value = false;
  targetMousePosition.value = { x: 0, y: 0 };

  // Start animation if not already running
  if (!animationFrame) {
    animateMousePosition();
  }
}

onMounted(() => {
  if (props.animate) {
    // Trigger animations on next tick to ensure DOM is ready
    requestAnimationFrame(() => {
      animateOnMount.value = true;
    });
  }
});
</script>

<style scoped>
svg {
  display: block;
  cursor: pointer;
  overflow: visible;

  width: 90px;
  height: auto;

  /* Logo color definitions for use in child components */

  --logo-stroke: #004563;
  --logo-stroke-width: 2;
  --logo-stroke-width-fine: 1.2;

  --logo-frame: var(--logo-stroke);
  --logo-frame-width: 3;

  --logo-hill-left: #08b7ba;
  --logo-hill-right: #50c074;

  /* --logo-balloon-basket: #d3b683; */
  --logo-balloon-basket: var(--logo-hill-left);

  --logo-balloon-red: #ec3936;
  --logo-balloon-orange: #f9b063;
  --logo-balloon-yellow: #fffece;

  /* Gradient colors (3 balloon gradients x 2 colors each) */
  --logo-gradient-body-outer: #ec3936;
  --logo-gradient-body-inner: #f9b063;

  --logo-gradient-shadow-outer: var(--logo-gradient-body-inner);
  --logo-gradient-shadow-inner: #fad3aa;

  --logo-gradient-reflection-outer: var(--logo-gradient-shadow-inner);
  --logo-gradient-reflection-inner: #fae6d1;

  /* Hill gradient colors */
  --logo-gradient-hill-left-inner: #08b7ba;
  --logo-gradient-hill-left-outer: #07a1a3;

  --logo-gradient-hill-right-inner: #50c074;
  --logo-gradient-hill-right-outer: #3f975b;
}

/* Smooth transitions for gradient positions */
:deep(radialGradient) {
  transition: cx 0.3s ease-out, cy 0.3s ease-out;
}
</style>

<style>
/* Unscoped for cross-component SVG element targeting */
#hot-air-balloon {
  transform-origin: center;
  transform: scale(1.5) translateY(-1px);
  transition: transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-svg:hover #hot-air-balloon {
  transform: translateY(-12%) scale(2);
}

/* Stroke scales at half the rate of the element (1.5x when element is 2x) */
#hot-air-balloon path,
#hot-air-balloon circle {
  vector-effect: non-scaling-stroke;
  transition: stroke-width 0.5s cubic-bezier(0.5, 1.5, 0.5, 1);
}

.logo-svg:hover #hot-air-balloon path,
.logo-svg:hover #hot-air-balloon circle {
  stroke-width: 2;
}
</style>
