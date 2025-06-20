<template>
  <div class="password-prompt-modal">
    <input
      ref="inputEl"
      v-model="password"
      type="password"
      class="password-prompt-modal__input"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose } from 'vue';

const password = ref('');
const inputEl = ref(null);

onMounted(() => {
  if (inputEl.value) inputEl.value.focus();
});

defineExpose({ password });
</script>

<style scoped>
.password-prompt-modal {
  display: flex;
  justify-content: center;
}
.password-prompt-modal__input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
</style>
