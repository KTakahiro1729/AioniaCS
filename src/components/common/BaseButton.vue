<template>
  <button v-bind="$attrs" @click="$emit('click')"><slot /></button>
</template>
<script setup>
defineEmits(['click'])
</script>
