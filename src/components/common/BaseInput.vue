<script setup>
const props = defineProps({
  modelValue: [String, Number],
});
const emit = defineEmits(['update:modelValue']);
function onInput(e) {
  emit('update:modelValue', e.target.value);
}
</script>
<template>
  <input :value="props.modelValue" @input="onInput" v-bind="$attrs" />
</template>
