<template>
  <div class="character-hub--controls">
    <template v-if="uiStore.isSignedIn">
      <button class="button-base character-hub-button character-hub--signout" @click="$emit('sign-out')">ログアウト</button>
      <button class="button-base character-hub-button character-hub--refresh" @click="$emit('refresh')">更新</button>
      <button class="button-base character-hub-button character-hub--new" @click="$emit('new')">新規保存</button>
    </template>
    <template v-else>
      <button class="button-base character-hub-button" @click="$emit('sign-in')">Googleにログイン</button>
    </template>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/uiStore.js';

const emit = defineEmits(['sign-in', 'sign-out', 'refresh', 'new']);
const uiStore = useUiStore();
</script>

<style scoped>
.character-hub--controls {
  display: flex;
  flex-direction: row;
  justify-content: right;
  gap: 8px;
  margin-right: 10px;
}
.character-hub-button {
  padding: 6px 8px;
  font-weight: 500;
  height: auto;
  width: auto;
}
</style>
