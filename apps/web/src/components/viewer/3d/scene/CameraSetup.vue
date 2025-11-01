<template>
  <TresPerspectiveCamera
    v-if="projectionMode === 'perspective'"
    ref="perspectiveCameraRef"
    :position="cameraPosition"
    :make-default="true"
  />
  <TresOrthographicCamera
    v-if="projectionMode === 'orthographic'"
    ref="orthographicCameraRef"
    :position="cameraPosition"
    :left="orthoFrustum.left"
    :right="orthoFrustum.right"
    :top="orthoFrustum.top"
    :bottom="orthoFrustum.bottom"
    :near="0.1"
    :far="2000"
    :make-default="true"
  />
  <OrbitControls make-default />
</template>

<script setup>
import { ref } from "vue";
import { OrbitControls } from "@tresjs/cientos";

defineProps({
  projectionMode: {
    type: String,
    required: true,
    validator: (value) => ["perspective", "orthographic"].includes(value),
  },
  cameraPosition: {
    type: Array,
    required: true,
  },
  orthoFrustum: {
    type: Object,
    required: true,
  },
});

// Camera refs for parent access (e.g., position preservation on mode switch)
const perspectiveCameraRef = ref(null);
const orthographicCameraRef = ref(null);

// Expose refs so parent can access camera instances
defineExpose({
  perspectiveCameraRef,
  orthographicCameraRef,
});
</script>
