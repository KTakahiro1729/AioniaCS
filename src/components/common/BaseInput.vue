<template>
  <input
    v-bind="$attrs"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    @input="onInput"
  />
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: Boolean,
});
const emit = defineEmits(['update:modelValue']);
function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>

