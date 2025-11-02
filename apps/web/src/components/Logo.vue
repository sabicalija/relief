<template>
  <!-- Inline SVG so CSS variables and theming work everywhere -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 19.66458 22.09722"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    :aria-labelledby="decorative ? undefined : titleId"
    :aria-hidden="decorative ? 'true' : 'false'"
    role="img"
    preserveAspectRatio="xMidYMid meet"
    :style="primaryColor ? { ['--color-primary']: primaryColor } : undefined"
    class="logo-svg"
  >
    <title v-if="!decorative" :id="titleId">{{ title }}</title>
    <defs id="defs1">
      <radialGradient
        xlink:href="#linearGradient24"
        id="radialGradient25"
        cx="-.73751"
        cy="7.63483"
        r="3.8129"
        fx="-.73751"
        fy="7.63483"
        gradientTransform="matrix(1.6092149,0,0,1.8314565,10.176895,-11.078589)"
        gradientUnits="userSpaceOnUse"
      />
      <radialGradient
        xlink:href="#linearGradient26"
        id="radialGradient27"
        cx="8.55755"
        cy="2.47534"
        r=".71579"
        fx="8.55755"
        fy="2.47534"
        gradientTransform="matrix(1,0,0,1.1632284,2.0404358,-1.1408012)"
        gradientUnits="userSpaceOnUse"
      />
      <linearGradient id="linearGradient26">
        <stop id="stop26" offset="0" stop-color="#fae6d1" stop-opacity="1" />
        <stop id="stop27" offset="1" stop-color="#fbb886" stop-opacity=".99608" />
      </linearGradient>
      <linearGradient id="linearGradient24">
        <stop id="stop24" offset="0" stop-color="#f9b063" stop-opacity=".99608" />
        <stop id="stop25" offset="1" stop-color="#ec3936" stop-opacity="1" />
      </linearGradient>
      <!-- Note: Avoid inline <style> in Vue template to prevent compiler errors. -->
    </defs>
    <g id="layer1" transform="translate(0.25,-0.07321083)">
      <g id="landscape" stroke-dasharray="none" display="inline">
        <LogoHillLeft :animate="animateOnMount" />
        <LogoHillRight :animate="animateOnMount" />
      </g>
      <LogoFrame :animate="animateOnMount" />
      <LogoBalloon :animate="animateOnMount" />
    </g>
  </svg>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import LogoFrame from "./logo/LogoFrame.vue";
import LogoHillLeft from "./logo/LogoHillLeft.vue";
import LogoHillRight from "./logo/LogoHillRight.vue";
import LogoBalloon from "./logo/LogoBalloon.vue";

const props = defineProps({
  size: { type: [Number, String], default: 128 },
  title: { type: String, default: "Relief logo" },
  decorative: { type: Boolean, default: false },
  primaryColor: { type: String, default: "" }, // optional override for --color-primary
  animate: { type: Boolean, default: true }, // Enable page-load animations
});

const titleId = computed(() => `logo-title-${Math.random().toString(36).slice(2)}`);
const animateOnMount = ref(false);

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
}
</style>

<style>
/* Unscoped for cross-component SVG element targeting */
#hot-air-balloon {
  transform-origin: center;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo-svg:hover #hot-air-balloon {
  transform: scale(1.15);
}
</style>
