<template>
  <div :class="['toast', `toast--${toast.type}`]">
    <div class="toast-icon" v-if="toast.icon">{{ toast.icon }}</div>
    <div class="toast-content">
      <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
      <div class="toast-message">{{ toast.message }}</div>
    </div>
    <button class="toast-close" @click="$emit('close')">×</button>
    <div class="toast-progress"></div>
  </div>
</template>

<script setup>
const props = defineProps({ toast: Object })
const emit = defineEmits(['close'])
</script>

<style scoped>
</style>
