<template>
  <div class="load-modal">
    <section class="load-modal__section">
      <label class="button-base load-modal__button">
        {{ loadLocalLabel }}
        <input type="file" class="hidden" accept=".json,.txt,.zip" @change="handleLocalChange" />
      </label>
    </section>

    <section class="load-modal__section load-modal__section--drive">
      <div class="load-modal__config">
        <label class="load-modal__label" :for="folderInputId">{{ driveFolderLabel }}</label>
        <div class="load-modal__input-group">
          <input
            :id="folderInputId"
            class="load-modal__input"
            type="text"
            v-model="folderPathInput"
            :placeholder="driveFolderPlaceholder"
            :disabled="isDriveControlsDisabled"
            @blur="commitFolderPath"
            @keyup.enter.prevent="commitFolderPath"
          />
          <button
            type="button"
            class="button-base load-modal__change-button"
            :disabled="isFolderPickerDisabled"
            @click="$emit('choose-drive-folder')"
          >
            {{ changeFolderLabel }}
          </button>
        </div>
      </div>
      <button
        class="button-base load-modal__button"
        :disabled="!canUseDrive"
        data-test="load-modal-drive-button"
        @click="$emit('load-drive')"
      >
        {{ loadDriveLabel }}
      </button>
    </section>

    <section v-if="!isSignedIn" class="load-modal__section load-modal__section--signin">
      <p class="load-modal__signin-message">{{ signInMessage }}</p>
      <button
        class="button-base load-modal__button"
        :disabled="!canSignIn"
        data-test="load-modal-signin"
        @click="$emit('sign-in')"
      >
        {{ signInLabel }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  isSignedIn: Boolean,
  canSignIn: Boolean,
  isDriveReady: Boolean,
  driveFolderPath: String,
  driveFolderLabel: String,
  driveFolderPlaceholder: String,
  changeFolderLabel: String,
  loadLocalLabel: String,
  loadDriveLabel: String,
  signInLabel: String,
  signInMessage: String,
});

const emit = defineEmits(['load-local', 'load-drive', 'sign-in', 'update-drive-folder-path', 'choose-drive-folder']);

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

const canUseDrive = computed(() => props.isSignedIn && props.isDriveReady);
const isDriveControlsDisabled = computed(() => !props.isSignedIn);
const isFolderPickerDisabled = computed(() => !canUseDrive.value);

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
}

.load-modal__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-modal__button {
  width: 100%;
  justify-content: center;
}

.load-modal__config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.load-modal__label {
  font-size: 0.9rem;
  font-weight: 600;
}

.load-modal__input-group {
  display: flex;
  width: 100%;
}

.load-modal__input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 4px 0 0 4px;
  border: 1px solid var(--color-border-normal);
  background-color: var(--color-panel-body);
  color: var(--color-text-primary, #fff);
}

.load-modal__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-modal__change-button {
  border-radius: 0 4px 4px 0;
  padding-inline: 12px;
}

.load-modal__section--signin {
  border-top: 1px solid var(--color-border-normal);
  padding-top: 12px;
}

.load-modal__signin-message {
  margin: 0;
  color: var(--color-text-muted, #ccc);
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
