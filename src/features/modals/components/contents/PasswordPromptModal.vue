<template>
  <div class="password-prompt-modal">
    <input type="password" v-model="password" class="password-prompt-modal__input" />
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
const password = ref('');

defineExpose({ password });
</script>

<style scoped>
.password-prompt-modal__input {
  margin-bottom: 10px;
}
</style>
