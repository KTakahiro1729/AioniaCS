<template>
  <div class="character-memo"> <!-- id="character_memo" removed, class is used for grid -->
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea
        id="character_text_cm" <!-- ID updated for potential uniqueness -->
        :placeholder="props.AioniaGameData.placeholderTexts.characterMemo"
        v-model="localMemo"
        class="character-memo-textarea" <!-- Styled by _sections.css and _components.css -->
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
/* All styles are expected to come from global CSS files. */
/* .character-memo (root) is styled by _layout.css (grid-area) */
/* .box-title, .box-content are styled by _components.css */
/* .character-memo-textarea is styled by _sections.css (min-height, width, resize) */
/* Base textarea properties (padding, border, font, colors, focus) are from _components.css */
</style>
