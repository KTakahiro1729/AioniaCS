<template>
  <div class="character-memo">
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea
        id="character_text_cm"
        :placeholder="props.AioniaGameData.placeholderTexts.characterMemo"
        v-model="localMemo"
        class="character-memo-textarea"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  characterMemo: {
    type: String,
    required: true,
  },
  AioniaGameData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:characterMemo', 'memo-changed']);

const localMemo = ref(props.characterMemo);

watch(() => props.characterMemo, (newVal) => {
  if (localMemo.value !== newVal) {
    localMemo.value = newVal;
  }
});

watch(localMemo, (newVal) => {
  if (props.characterMemo !== newVal) {
    emit('update:characterMemo', newVal);
    emit('memo-changed');
  }
});

</script>

<style scoped>
/* .character-memo (root) is styled by _layout.css (grid-area) */
/* .box-title, .box-content general styles are from _components.css */
/* Base textarea properties (padding, border, font, colors, focus) are from _components.css */

/* Styles moved from _sections.css */
.character-memo .box-content { /* Applied to the direct .box-content child of .character-memo */
  max-width: 100%;
}

.character-memo-textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  /* Other base styles like padding, border, font-size will come from global textarea style */
}
</style>
