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
import { messages } from '@/i18n/index.js';

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

<style scoped>
:global(.base-list-item) {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-bottom: 8px;
}

:global(.base-list-item .delete-button-wrapper) {
  margin-top: 4px;
}

:global(.delete-button-wrapper) {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:global(.list-button) {
  padding: 0;
  user-select: none;
  font-size: 1.2em;
  font-weight: bold;
  width: 30px;
  height: 30px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
  line-height: 1;
  background-color: var(--color-panel-body);
  color: var(--color-accent);
}

:global(.list-button--delete) {
  color: var(--color-delete-text);
  border-color: var(--color-delete-border);
}

:global(.list-button--delete:hover:not(:disabled)) {
  color: var(--color-delete-text);
  border-color: var(--color-delete-text);
  box-shadow:
    inset 0 0 3px var(--color-delete-text),
    0 0 6px var(--color-delete-text);
  text-shadow: 0 0 2px var(--color-delete-text);
}
</style>
