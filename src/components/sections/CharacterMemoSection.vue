<script setup>
import { AioniaGameData } from '../../data/gameData.js';
const props = defineProps({
  character: Object,
});
</script>
<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea
        id="character_text"
        :placeholder="AioniaGameData.placeholderTexts.characterMemo"
        v-model="character.memo"
        class="character-memo-textarea"
      ></textarea>
    </div>
  </div>
</template>
