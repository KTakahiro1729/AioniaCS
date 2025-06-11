<template>
  <transition name="fade">
    <div class="help-panel" v-if="isVisible" ref="panelEl">
      <button class="help-close" @click="$emit('close')">×</button>
      <div v-html="helpText"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, defineExpose } from 'vue';

const props = defineProps({
  isVisible: Boolean,
  helpText: String,
});

const emit = defineEmits(['close']);

const panelEl = ref(null);

defineExpose({ panelEl });
</script>

<style scoped>
</style>

