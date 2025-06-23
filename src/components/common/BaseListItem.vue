<template>
  <li class="base-list-item">
    <div v-if="showDeleteButton" class="delete-button-wrapper">
      <button
        type="button"
        class="button-base list-button list-button--delete"
        @click="emitDelete"
        :disabled="!canDelete"
        aria-label="項目を削除"
      >
        －
      </button>
    </div>
    <slot />
  </li>
</template>

<script setup>
defineProps({
  showDeleteButton: Boolean,
  canDelete: { type: Boolean, default: true },
});
const emit = defineEmits(['delete-item']);
function emitDelete() {
  emit('delete-item');
}
</script>
