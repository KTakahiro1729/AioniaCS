<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea
        id="character_text"
        class="character-memo-textarea"
        :placeholder="AioniaGameData.placeholderTexts.characterMemo"
        v-model="localValue"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';

const characterStore = useCharacterStore();
const localValue = computed({
  get: () => characterStore.character.memo,
  set: (val) => {
    characterStore.character.memo = val;
  },
});
</script>

