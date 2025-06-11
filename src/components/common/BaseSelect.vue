<template>
  <select v-bind="$attrs" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <slot />
  </select>
</template>
<script setup>
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>
