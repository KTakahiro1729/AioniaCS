<template>
  <button
    class="button-base animated-button"
    :class="[stateClass, { 'is-animating': isAnimating }]"
    :disabled="isAnimating"
    @click="$emit('click')"
  >
    {{ currentLabel }}
  </button>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  defaultLabel: { type: String, default: '' },
  animatingLabel: { type: String, default: '' },
  successLabel: { type: String, default: '' },
  trigger: { type: Number, default: 0 },
  timings: {
    type: Object,
    default: () => ({
      state1_bgFill: 500,
      state2_textHold: 1000,
      state3_textFadeOut: 500,
      state4_bgReset: 700,
      state5_successHold: 300,
    }),
  },
});

const emit = defineEmits(['finished', 'click']);

const currentLabel = ref(props.defaultLabel);
const stateClass = ref('');
const isAnimating = ref(false);

watch(
  () => props.trigger,
  () => {
    startAnimation();
  },
);

watch(() => props.defaultLabel, (newLabel) => {
  if (!isAnimating.value) {
    currentLabel.value = newLabel;
  }
});

function startAnimation() {
  if (isAnimating.value) {
    return;
  }
  isAnimating.value = true;
  stateClass.value = 'state-1';
  setTimeout(() => {
    stateClass.value = 'state-2';
    currentLabel.value = props.animatingLabel;
  }, props.timings.state1_bgFill);
  setTimeout(() => {
    stateClass.value = 'state-3';
  }, props.timings.state1_bgFill + props.timings.state2_textHold);
  setTimeout(() => {
    stateClass.value = 'state-4';
    currentLabel.value = props.successLabel;
  },
  props.timings.state1_bgFill +
    props.timings.state2_textHold +
    props.timings.state3_textFadeOut);
  setTimeout(() => {
    stateClass.value = '';
    currentLabel.value = props.defaultLabel;
    isAnimating.value = false;
    emit('finished');
  },
  props.timings.state1_bgFill +
    props.timings.state2_textHold +
    props.timings.state3_textFadeOut +
    props.timings.state4_bgReset +
    props.timings.state5_successHold);
}
</script>

<style scoped>
.animated-button.state-1 {
  transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}
.animated-button.state-2 {
  transition: color 0.1s ease-in;
  background-color: var(--color-accent-light);
  color: var(--color-background);
}
.animated-button.state-3 {
  transition: color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}
.animated-button.state-4 {
  transition: background-color 0.7s ease-in-out, color 0.2s ease-in-out 0.5s;
  background-color: transparent;
  color: var(--color-accent);
}
.animated-button.is-animating {
  pointer-events: none;
}
</style>