<template>
  <li class="base-list-item">
    <div v-if="showDeleteButton" class="delete-button-wrapper">
      <button
        type="button"
        class="button-base list-button list-button--delete"
        @click="emitDelete"
        :disabled="!canDelete"
        :aria-label="sheetMessages.aria.deleteItem"
      >
        －
      </button>
    </div>
    <slot />
  </li>
</template>

<script setup>
import { messages } from '../../locales/ja.js';

defineProps({
  showDeleteButton: Boolean,
  canDelete: { type: Boolean, default: true },
});
const emit = defineEmits(['delete-item']);
const sheetMessages = messages.sheet;
function emitDelete() {
  emit('delete-item');
}
</script>
