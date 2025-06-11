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

const props = defineProps({
  modelValue: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
</script>

