<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">{{ sheetMessages.sections.memo.title }}</div>
    <div class="box-content">
      <textarea
        id="character_text"
        class="character-memo-textarea"
        :placeholder="sheetMessages.placeholders.characterMemo"
        v-model="localValue"
        :readonly="uiStore.isViewingShared"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/locales/ja.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const sheetMessages = messages.sheet;
const localValue = computed({
  get: () => characterStore.character.memo,
  set: (val) => {
    characterStore.character.memo = val;
  },
});
</script>

<style scoped>
.character-memo .box-content {
  max-width: 100%;
}

.character-memo-textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
}
</style>
