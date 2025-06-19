import { computed } from "vue";

<template>
  <button
    v-bind="$attrs"
    :class="buttonClasses"
    :disabled="disabled"
    @click="onClick"
  >
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
  return [
    'button-base',
    props.variant ? `button-base--${props.variant}` : '',
    props.size ? `button-base--${props.size}` : '',
  ];
});
function onClick(e) {
  emit('click', e);
}
</script>

<style scoped>
/* BaseButton styles */
.button-base {
  cursor: pointer;
  border-radius: 3px;
  border: 1px solid var(--color-accent-middle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    text-shadow 0.5s ease,
    color 0.5s ease,
    border-color 0.5s ease,
    background-color 0.5s ease,
    box-shadow 0.5s ease;
  flex-shrink: 0;
  background-color: transparent;
  color: var(--color-accent);
  text-decoration: none;
  padding: 10px 18px;
  font-size: 0.95em;
  height: 48px;
  font-weight: 700;
  text-align: center;
  box-sizing: border-box;
}

.button-base:hover {
  border-color: var(--color-accent);
  color: var(--color-accent-light);
  background-color: transparent;
  box-shadow:
    inset 0 0 3px var(--color-accent),
    0 0 6px var(--color-accent);
  text-shadow: 0 0 1px var(--color-accent);
}

.button-base:disabled {
  cursor: default;
  background-color: transparent;
  color: var(--color-border-normal);
  border-color: var(--color-border-normal);
  box-shadow: none;
  text-shadow: none;
}

.button-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--color-link);
  text-decoration: underline;
  font: inherit;
}

.button-link:hover {
  color: var(--color-link-hover);
}
</style>


