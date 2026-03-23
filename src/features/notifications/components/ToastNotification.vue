<template>
  <div :class="['toast', `toast--${toast.type}`]">
    <div class="toast-icon">!</div>
    <div class="toast-content">
      <div class="toast-title">{{ toast.title }}</div>
      <div class="toast-message">{{ toast.message }}</div>
    </div>
    <button class="toast-close" @click="$emit('close')">×</button>
    <div class="toast-progress" v-if="toast.duration && toast.duration > 0" :style="{ animationDuration: `${toast.duration}ms` }"></div>
  </div>
</template>

<script setup>
const props = defineProps({ toast: Object });
const emit = defineEmits(['close']);
</script>
