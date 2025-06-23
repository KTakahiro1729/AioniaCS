<template>
  <select v-bind="$attrs" :disabled="disabled" :value="modelValue" @change="onChange">
    <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
      {{ option.label }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  disabled: Boolean,
});
const emit = defineEmits(['update:modelValue']);
function onChange(e) {
  emit('update:modelValue', e.target.value);
}
</script>
