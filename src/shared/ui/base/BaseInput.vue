<template>
  <input
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    :class="joinedClasses"
    @input="onInput"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: Boolean,
  joined: { type: String, default: 'none' },
});
const emit = defineEmits(['update:modelValue']);
const joinedClasses = computed(() => ({
  'is-joined-left': props.joined === 'left' || props.joined === 'both',
  'is-joined-right': props.joined === 'right' || props.joined === 'both',
}));
function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>
