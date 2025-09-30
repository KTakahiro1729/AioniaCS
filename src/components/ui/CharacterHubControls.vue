<template>
  <div class="character-hub-controls">
    <template v-if="uiStore.isSignedIn">
      <button class="button-base character-hub-controls__button" @click="$emit('change-folder')">
        {{ labels.changeFolder }}
      </button>
      <button class="button-base character-hub-controls__button" @click="$emit('refresh')">
        {{ labels.refresh }}
      </button>
      <button class="button-base character-hub-controls__button" @click="$emit('open-picker')">
        {{ labels.openPicker }}
      </button>
      <button class="button-base character-hub-controls__button" @click="$emit('save-new')">
        {{ labels.saveNew }}
      </button>
      <button
        class="button-base character-hub-controls__button"
        :disabled="!uiStore.currentDriveFileId"
        @click="$emit('save-current')"
      >
        {{ labels.saveOverwrite }}
      </button>
      <button class="button-base character-hub-controls__button" @click="$emit('sign-out')">
        {{ labels.signOut }}
      </button>
    </template>
    <template v-else>
      <button class="button-base character-hub-controls__button" @click="$emit('sign-in')">
        {{ labels.signIn }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/uiStore.js';

defineProps({
  labels: {
    type: Object,
    required: true,
  },
});

defineEmits(['sign-in', 'sign-out', 'refresh', 'save-new', 'save-current', 'change-folder', 'open-picker']);
const uiStore = useUiStore();
</script>

<style scoped>
.character-hub-controls {
  display: flex;
  flex-direction: row;
  justify-content: right;
  gap: 8px;
  margin-right: 10px;
}
.character-hub-controls__button {
  padding: 6px 8px;
  font-weight: 500;
  height: auto;
  width: auto;
}
.character-hub-controls__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
