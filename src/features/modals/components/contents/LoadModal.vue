<template>
  <div class="load-modal">
    <div class="load-modal__header">
      <div class="load-modal__tab-actions">
        <label class="button-base button-base--ghost load-modal__tab-button">
          {{ loadLocalLabel }}
          <input type="file" class="hidden" accept=".json,.txt,.zip" @change="handleLocalChange" />
        </label>
        <button
          class="button-base button-base--ghost load-modal__tab-button"
          :disabled="!hasHistory"
          data-test="load-modal-history-button"
          @click="$emit('open-history')"
        >
          {{ restoreHistoryLabel }}
        </button>
      </div>
    </div>

    <div class="load-modal__drive-scroll">
      <template v-if="isSignedIn">
        <DriveLoadContent :is-signed-in="isSignedIn" :is-drive-ready="isDriveReady" :load-character-from-drive="loadCharacterFromDrive" />
      </template>
      <div v-else class="load-modal__signin">
        <p class="load-modal__signin-message">{{ signInMessage }}</p>
        <button
          class="button-base load-modal__signin-button"
          :disabled="!canSignIn"
          data-test="load-modal-signin"
          @click="$emit('sign-in')"
        >
          {{ signInLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import DriveLoadContent from '@/features/modals/components/contents/DriveLoadContent.vue';

defineProps({
  isSignedIn: Boolean,
  canSignIn: Boolean,
  isDriveReady: Boolean,
  loadLocalLabel: String,
  restoreHistoryLabel: String,
  loadCharacterFromDrive: Function,
  hasHistory: Boolean,
  signInLabel: String,
  signInMessage: String,
});

const emit = defineEmits(['load-local', 'sign-in', 'open-history']);

function handleLocalChange(event) {
  emit('load-local', event);
  event.target.value = '';
}
</script>

<style scoped>
.load-modal {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 72vh;
}

.load-modal * {
  min-width: 0;
}

.load-modal__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 14px;
}

.load-modal__tab-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.load-modal__tab-button {
  height: 30px;
  padding: 4px 10px;
  font-size: 0.8rem;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.load-modal__signin {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px;
  align-items: center;
}

.load-modal__signin-message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
}

.load-modal__signin-button {
  width: 100%;
  max-width: 240px;
  justify-content: center;
}

.load-modal__drive-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible;
  padding-right: 0;
}

.load-modal__drive-hint {
  margin: 0;
  padding: 16px 14px;
  color: var(--color-text-muted);
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
