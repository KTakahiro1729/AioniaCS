import { computed } from "vue";

<template>
  <button v-bind="$attrs" :class="buttonClasses" :disabled="disabled" @click="onClick">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: String,
  size: String,
  disabled: Boolean,
});
const emit = defineEmits(['click']);
const buttonClasses = computed(() => {
  return ['button-base', props.variant ? `button-base--${props.variant}` : '', props.size ? `button-base--${props.size}` : ''];
});
function onClick(e) {
  emit('click', e);
}
</script>
