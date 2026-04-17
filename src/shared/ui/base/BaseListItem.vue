<template>
  <li class="base-list-item">
    <div class="delete-button-wrapper">
      <button
        type="button"
        class="button-base button-base--delete list-button"
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
import { messages } from '@/i18n/index.js';

defineProps({
  canDelete: { type: Boolean, default: true },
});
const emit = defineEmits(['delete-item']);
const sheetMessages = messages.sheet;
function emitDelete() {
  emit('delete-item');
}
</script>
