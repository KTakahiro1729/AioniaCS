<template>
  <div class="character-hub">
    <template v-if="uiStore.isSignedIn">
      <div class="character-hub--actions">
        <div class="character-hub--config">
          <label class="character-hub--label" for="drive_folder_path">保存先フォルダ</label>
          <div class="character-hub--input-with-button">
            <input
              id="drive_folder_path"
              class="character-hub--input"
              type="text"
              v-model="folderPathInput"
              :disabled="!uiStore.isSignedIn"
              placeholder="慈悲なきアイオニア"
              @blur="commitFolderPath"
              @keyup.enter.prevent="commitFolderPath"
            />
            <button
              class="button-base character-hub--button-inline"
              :disabled="!uiStore.isSignedIn || !isDriveReady"
              type="button"
              @click="emitDriveFolder"
            >
              変更
            </button>
          </div>
        </div>
        <button class="button-base character-hub--button" :disabled="!isDriveReady" @click="loadCharacterFromDrive">
          Driveから読み込む
        </button>
        <button class="button-base character-hub--button" :disabled="!isDriveReady" @click="saveNewCharacter">
          新しい冒険者として保存
        </button>
        <button class="button-base character-hub--button" :disabled="!isOverwriteEnabled" @click="saveOverwrite">上書き保存</button>
        <button class="button-base character-hub--button" @click="emitSignOut">ログアウト</button>
      </div>
    </template>
    <template v-else>
      <div class="character-hub--actions">
        <button class="button-base character-hub--button" :disabled="!canSignIn" @click="emitSignIn">Googleにログイン</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useGoogleDrive } from '../../composables/useGoogleDrive.js';

const props = defineProps({
  dataManager: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['sign-in', 'sign-out', 'drive-folder']);

const uiStore = useUiStore();
const {
  loadCharacterFromDrive: loadFromDrive,
  saveCharacterToDrive,
  isDriveReady,
  canSignInToGoogle,
  updateDriveFolderPath,
} = useGoogleDrive(props.dataManager);

const canSignIn = computed(() => canSignInToGoogle.value);
const isOverwriteEnabled = computed(() => isDriveReady.value && !!uiStore.currentDriveFileId);
const folderPathInput = ref(uiStore.driveFolderPath);

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

function emitDriveFolder() {
  if (!uiStore.isSignedIn || !isDriveReady.value) {
    return;
  }
  emit('drive-folder');
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

.character-hub--input-with-button {
  display: flex;
}

.character-hub--label {
  font-size: 0.9rem;
  font-weight: 600;
}

.character-hub--input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
  background-color: var(--color-panel-body);
  color: var(--color-text-primary, #fff);
}

.character-hub--input-with-button .character-hub--input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
  flex-grow: 1;
}

.character-hub--button-inline {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  flex-shrink: 0;
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
