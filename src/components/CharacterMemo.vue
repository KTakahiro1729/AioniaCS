<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">キャラクターメモ</div>
    <div class="box-content">
      <textarea
        id="character_text"
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

// Watch for prop changes to update localMemo
watch(() => props.characterMemo, (newVal) => {
  if (localMemo.value !== newVal) {
    localMemo.value = newVal;
  }
});

// Watch for localMemo changes to emit update to parent
// This is implicitly handled by v-model on textarea,
// but for explicit control or if other logic needed to run:
watch(localMemo, (newVal) => {
  // Avoid emitting if the change came from the prop update
  if (props.characterMemo !== newVal) {
    emit('update:characterMemo', newVal);
    emit('memo-changed'); // General notification if needed
  }
});

// Alternatively, instead of the deep watch on localMemo,
// you could use @input or @change on the textarea
// <textarea ... @input="handleMemoInput" ... />
// const handleMemoInput = (event) => {
//   localMemo.value = event.target.value;
//   emit('update:characterMemo', localMemo.value);
//   emit('memo-changed');
// };
// Using v-model and watching localMemo is generally cleaner for simple cases.

</script>

<style scoped>
/* Styles specific to #character_memo */
.character-memo {
  grid-area: character-memo; /* Assigns this component to the 'character-memo' grid area */
  /* Assuming .box-title and .box-content are styled globally or by the grid container */
}

.character-memo-textarea {
  width: 100%;
  min-height: var(--textarea-large-min-height, 150px); /* Or specific height like 8em or more */
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box;
  resize: vertical; /* Allow vertical resize */
}

.character-memo-textarea:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}
</style>
