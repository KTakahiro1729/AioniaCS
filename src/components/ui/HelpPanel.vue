<template>
  <transition name="fade">
    <div class="help-panel" v-if="visible" ref="helpPanel">
      <button class="help-close" @click="emit('close')">×</button>
      <div v-html="helpText"></div>
    </div>
  </transition>
</template>
<script setup>
const props = defineProps({ visible: Boolean, helpText: String });
const emit = defineEmits(['close']);
</script>
