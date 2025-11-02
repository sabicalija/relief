<template>
  <g :class="{ 'animate-drop': animate }">
    <g id="hot-air-balloon">
      <path
        id="basket"
        fill="#08b7ba"
        stroke="#004563"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity="1"
        stroke-width=".6"
        d="M10.05 12.23092h3l-.23386 1.99584h-2.53228z"
        display="inline"
        transform="translate(-0.05,-0.05)"
      />
      <g id="balloon" stroke-dasharray="none" stroke-linecap="round" stroke-linejoin="round" display="inline">
        <path
          id="path1"
          fill="#d52b37"
          fill-opacity=".99608"
          stroke="none"
          stroke-opacity="1"
          stroke-width=".6"
          d="m13.5645 10.26044-4.129.00003C8.72839 9.03569 6.85669 7.21488 6.85669 5 6.85668 2.43556 8.93556.35668 11.5.35667c2.56444 0 4.64332 2.0789 4.64332 4.64333 0 2.23726-1.72605 3.7834-2.57882 5.26044z"
          display="inline"
        />
        <circle
          id="balloon2"
          cx="10.95898"
          cy="4.44359"
          r="4.1271"
          fill="url(#radialGradient25)"
          fill-rule="evenodd"
          stroke="none"
          stroke-opacity=".99608"
          stroke-width=".64944"
          display="inline"
        />
        <path
          id="balloon3"
          fill="url(#radialGradient27)"
          fill-opacity=".99608"
          fill-rule="evenodd"
          stroke="none"
          stroke-opacity=".99608"
          stroke-width=".6"
          d="M10.0294 2.66279c-.02674-.1041-.08185-.56712.68404-1.29209.35743-.33832.68773-.12215.73082.1637.05721.3796-.51367 1.02845-.90621 1.24532-.14252.07873-.43143.18367-.50865-.11693Z"
        />
        <path
          id="balllon4"
          fill="none"
          fill-opacity=".99608"
          stroke="#004563"
          stroke-opacity="1"
          stroke-width=".6"
          d="m13.5645 10.26044-4.129.00003C8.72839 9.03569 6.85669 7.21488 6.85669 5 6.85668 2.43556 8.93556.37321 11.5.37321c2.56444 0 4.64332 2.06235 4.64332 4.62679v0c0 2.23726-1.72605 3.7834-2.57882 5.26044z"
          display="inline"
        />
      </g>
      <g
        id="outline"
        fill="none"
        stroke="#004563"
        stroke-dasharray="none"
        stroke-opacity="1"
        stroke-width=".4"
        display="inline"
      >
        <path
          id="rope-left"
          fill-opacity=".99216"
          stroke-linecap="butt"
          stroke-linejoin="round"
          d="m10 12.18092-.56448-1.92042"
        />
        <path
          id="rope-right"
          fill-opacity=".99216"
          stroke-linecap="butt"
          stroke-linejoin="round"
          d="m13 12.18092.5645-1.92047"
          display="inline"
        />
        <path
          id="rope-center"
          fill-opacity="1"
          stroke-linecap="round"
          stroke-linejoin="miter"
          d="M11.54885.42321c-3.14292.2413-2.89903 3.59996-2.44083 5.53467.36839 1.55548 1.78117 4.1386 1.97595 6.27304m.46488-11.8077c3.14292.2413 2.89904 3.59995 2.44083 5.53466-.36839 1.55548-1.78117 4.1386-1.97594 6.27304"
          display="inline"
          transform="translate(-0.05,-0.05)"
        />
        <path
          id="rope-balloon"
          fill-opacity=".99608"
          fill-rule="evenodd"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6.9587 5.90788s1.02945.61769 2.09932 0m6.98328 0s-1.02945.61769-2.09932 0"
        />
        <path
          id="rope-balloon-center"
          fill-opacity=".99608"
          fill-rule="evenodd"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9.05802 5.90788c1.51545 1.76202 3.87308 1.27063 4.88166 0"
        />
      </g>
    </g>
  </g>
</template>

<script setup>
defineProps({
  animate: { type: Boolean, default: false },
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
