<template>
  <div class="load-modal">
    <section class="load-modal__section load-modal__section--controls">
      <div v-if="!isSignedIn" class="load-modal__signin">
        <p class="load-modal__signin-message">{{ signInMessage }}</p>
        <button class="button-base load-modal__button" :disabled="!canSignIn" data-test="load-modal-signin" @click="$emit('sign-in')">
          {{ signInLabel }}
        </button>
      </div>
      <label class="button-base load-modal__button">
        {{ loadLocalLabel }}
        <input type="file" class="hidden" accept=".json,.txt,.zip" @change="handleLocalChange" />
      </label>
      <div class="load-modal__config">
        <label class="load-modal__label" :for="folderInputId">{{ driveFolderLabel }}</label>
        <div class="load-modal__input-group">
          <BaseInput
            :id="folderInputId"
            class="load-modal__input"
            type="text"
            v-model="folderPathInput"
            :placeholder="driveFolderPlaceholder"
            :disabled="isDriveControlsDisabled"
            :joined="'right'"
            @blur="commitFolderPath"
            @keyup.enter.prevent="commitFolderPath"
          />
          <button
            class="button-base button-base--primary load-modal__apply is-joined-left"
            type="button"
            :disabled="isDriveControlsDisabled"
            data-test="load-modal-apply-folder"
            @click="commitFolderPath"
          >
            {{ driveFolderChangeLabel }}
          </button>
        </div>
      </div>
    </section>
    <div class="load-modal__divider" />
    <section class="load-modal__section load-modal__section--drive">
      <div class="load-modal__drive-scroll">
        <DriveLoadContent
          v-if="isSignedIn"
          :is-signed-in="isSignedIn"
          :is-drive-ready="isDriveReady"
          :load-character-from-drive="loadCharacterFromDrive"
        />
        <p v-else class="load-modal__drive-hint">{{ signInMessage }}</p>
      </div>
    </section>
    <section class="load-modal__section load-modal__section--history">
      <button
        class="button-base load-modal__button"
        :disabled="!hasHistory"
        data-test="load-modal-history-button"
        @click="$emit('open-history')"
      >
        {{ restoreHistoryLabel }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import BaseInput from '@/shared/ui/base/BaseInput.vue';
import DriveLoadContent from '@/features/modals/components/contents/DriveLoadContent.vue';

const props = defineProps({
  isSignedIn: Boolean,
  canSignIn: Boolean,
  isDriveReady: Boolean,
  driveFolderPath: String,
  driveFolderLabel: String,
  driveFolderChangeLabel: { type: String, default: 'Apply' },
  driveFolderPlaceholder: String,
  loadLocalLabel: String,
  loadDriveLabel: String,
  restoreHistoryLabel: String,
  loadCharacterFromDrive: Function,
  hasHistory: Boolean,
  signInLabel: String,
  signInMessage: String,
});

const emit = defineEmits(['load-local', 'load-drive', 'sign-in', 'update-drive-folder-path', 'choose-drive-folder', 'open-history']);

const folderInputId = 'load_modal_drive_folder';
const folderPathInput = ref(props.driveFolderPath || '');

watch(
  () => props.driveFolderPath,
  (value) => {
    folderPathInput.value = value || '';
  },
);

watch(
  () => props.isSignedIn,
  (signedIn) => {
    if (!signedIn) {
      folderPathInput.value = props.driveFolderPath || '';
    }
  },
);

const isDriveControlsDisabled = computed(() => !props.isSignedIn);

function commitFolderPath() {
  if (!props.isSignedIn) {
    folderPathInput.value = props.driveFolderPath || '';
    return;
  }
  emit('update-drive-folder-path', folderPathInput.value);
}

function handleLocalChange(event) {
  emit('load-local', event);
  event.target.value = '';
}
</script>

<style scoped>
.load-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
}

.load-modal__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-modal__section--controls,
.load-modal__section--drive {
  min-height: 0;
}

.load-modal__section--drive {
  flex: 1 1 auto;
}

.load-modal__signin {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.load-modal__button {
  width: 100%;
  justify-content: center;
}

.load-modal__divider {
  border-top: 1px solid var(--color-border-normal);
}

.load-modal__drive-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.load-modal__drive-hint {
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
}

.load-modal__config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.load-modal__input-group {
  display: flex;
  flex-wrap: wrap;
  column-gap: 0;
  row-gap: 8px;
  align-items: stretch;
}

.load-modal__button--secondary {
  background-color: var(--color-panel);
  color: var(--color-text-primary, #fff);
  border: 1px solid var(--color-border-normal);
}

.load-modal__label {
  font-size: 0.9rem;
  font-weight: 600;
}

.load-modal__input {
  flex: 1 1 0;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
  background-color: var(--color-panel-body);
  color: var(--color-text-primary, #fff);
  box-sizing: border-box;
}

.load-modal__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-modal__apply {
  flex: 0 0 auto;
  height: 48px;
  padding-inline: 16px;
}

.load-modal__section--history {
  border-top: 1px solid var(--color-border-normal);
  padding-top: 12px;
}

.load-modal__signin-message {
  margin: 0;
  color: var(--color-text-muted);
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
