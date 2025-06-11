<script setup>
const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(['close']);
</script>
<template>
  <transition name="fade">
    <div class="help-panel" v-if="visible">
      <button class="help-close" @click="emit('close')">×</button>
      <slot />
    </div>
  </transition>
</template>
