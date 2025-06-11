<script setup>
const props = defineProps({
  modelValue: [String, Number]
});
const emit = defineEmits(['update:modelValue']);
function onChange(e) {
  emit('update:modelValue', e.target.value);
}
</script>
<template>
  <select :value="props.modelValue" @change="onChange" v-bind="$attrs">
    <slot />
  </select>
</template>
