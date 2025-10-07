<template>
  <div class="character-hub">
    <template v-if="uiStore.isSignedIn">
      <div class="character-hub--actions">
        <div class="character-hub--config">
          <label class="character-hub--label" for="drive_folder_path">{{ hubMessages.driveFolder.label }}</label>
          <div class="character-hub--input-group">
            <input
              id="drive_folder_path"
              class="character-hub--input"
              type="text"
              v-model="folderPathInput"
              :disabled="!uiStore.isSignedIn"
              :placeholder="hubMessages.driveFolder.placeholder"
              @blur="commitFolderPath"
              @keyup.enter.prevent="commitFolderPath"
            />
            <button
              type="button"
              class="button-base character-hub--change-button"
              :disabled="!isFolderPickerEnabled"
              @click="openFolderPicker"
            >
              {{ changeFolderLabel }}
            </button>
          </div>
        </div>
        <button class="button-base character-hub--button" :disabled="!isDriveReady" @click="loadCharacterFromDrive">
          {{ hubMessages.buttons.load }}
        </button>
        <button class="button-base character-hub--button" :disabled="!isDriveReady" @click="saveNewCharacter">
          {{ hubMessages.buttons.saveNew }}
        </button>
        <button class="button-base character-hub--button" :disabled="!isOverwriteEnabled" @click="saveOverwrite">
          {{ hubMessages.buttons.overwrite }}
        </button>
        <button class="button-base character-hub--button" @click="emitSignOut">{{ hubMessages.buttons.signOut }}</button>
      </div>
    </template>
    <template v-else>
      <div class="character-hub--actions">
        <button class="button-base character-hub--button" :disabled="!canSignIn" @click="emitSignIn">
          {{ hubMessages.buttons.signIn }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useGoogleDrive } from '../../composables/useGoogleDrive.js';
import { messages } from '../../locales/ja.js';

const props = defineProps({
  dataManager: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['sign-in', 'sign-out']);

const uiStore = useUiStore();
const {
  loadCharacterFromDrive: loadFromDrive,
  saveCharacterToDrive,
  isDriveReady,
  canSignInToGoogle,
  updateDriveFolderPath,
  promptForDriveFolder,
} = useGoogleDrive(props.dataManager);

const canSignIn = computed(() => canSignInToGoogle.value);
const isOverwriteEnabled = computed(() => isDriveReady.value && !!uiStore.currentDriveFileId);
const folderPathInput = ref(uiStore.driveFolderPath);
const hubMessages = messages.characterHub;
const changeFolderLabel = hubMessages.driveFolder.changeButton;
const isFolderPickerEnabled = computed(() => isDriveReady.value && uiStore.isSignedIn);

watch(
  () => uiStore.driveFolderPath,
  (path) => {
    folderPathInput.value = path;
  },
  { immediate: true },
);

function loadCharacterFromDrive() {
  if (!isDriveReady.value) return null;
  return loadFromDrive();
}

function emitSignIn() {
  emit('sign-in');
}

function emitSignOut() {
  emit('sign-out');
}

function saveNewCharacter() {
  if (!isDriveReady.value) return null;
  return saveCharacterToDrive(true);
}

function saveOverwrite() {
  if (!isOverwriteEnabled.value) {
    return null;
  }
  return saveCharacterToDrive(false);
}

async function commitFolderPath() {
  if (!uiStore.isSignedIn) {
    folderPathInput.value = uiStore.driveFolderPath;
    return;
  }
  const desired = folderPathInput.value;
  if (desired === uiStore.driveFolderPath) {
    return;
  }
  const normalized = await updateDriveFolderPath(desired);
  folderPathInput.value = normalized;
}

async function openFolderPicker() {
  if (!isFolderPickerEnabled.value) {
    return;
  }
  const selected = await promptForDriveFolder();
  folderPathInput.value = selected;
}
</script>

<style scoped>
.character-hub {
  display: flex;
  justify-content: center;
}

.character-hub--config {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.character-hub--label {
  font-size: 0.9rem;
  font-weight: 600;
}

.character-hub--input {
  width: 100%;
  flex: 1 1 auto;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
  background-color: var(--color-panel-body);
  color: var(--color-text-primary, #fff);
}

.character-hub--input-group {
  display: flex;
  align-items: stretch;
  width: 100%;
}

.character-hub--input-group .character-hub--input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.character-hub--input-group .character-hub--input:disabled {
  border-color: var(--color-border-normal);
}

.character-hub--change-button {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  padding-inline: 5px;
  padding:5px;
  height:unset;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
}

.character-hub--change-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.character-hub--input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.character-hub--actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.character-hub--button {
  width: 100%;
  padding: 10px 12px;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.character-hub--button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
