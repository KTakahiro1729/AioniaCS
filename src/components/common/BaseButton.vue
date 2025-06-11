<script setup>
const emit = defineEmits(['click']);
</script>
<template>
  <button class="button-base" v-bind="$attrs" @click="(e) => emit('click', e)">
    <slot />
  </button>
</template>
