<template>
  <div class="character-hub">
    <template v-if="uiStore.isSignedIn">
      <div class="character-hub--actions">
        <button class="button-base character-hub--button" @click="loadCharacterFromDrive">
          Driveから読み込む
        </button>
        <button class="button-base character-hub--button" @click="saveNewCharacter">
          新しい冒険者として保存
        </button>
        <button
          class="button-base character-hub--button"
          :disabled="!isOverwriteEnabled"
          @click="saveOverwrite"
        >
          上書き保存
        </button>
        <button class="button-base character-hub--button" @click="emitSignOut">
          ログアウト
        </button>
      </div>
    </template>
    <template v-else>
      <div class="character-hub--actions">
        <button class="button-base character-hub--button" @click="emitSignIn">
          Googleにログイン
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useGoogleDrive } from '../../composables/useGoogleDrive.js';

const props = defineProps({
  dataManager: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['sign-in', 'sign-out']);

const uiStore = useUiStore();
const { loadCharacterFromDrive, saveCharacterToDrive } = useGoogleDrive(props.dataManager);

const isOverwriteEnabled = computed(() => !!uiStore.currentDriveFileId);

function emitSignIn() {
  emit('sign-in');
}

function emitSignOut() {
  emit('sign-out');
}

function saveNewCharacter() {
  return saveCharacterToDrive(true);
}

function saveOverwrite() {
  if (!isOverwriteEnabled.value) {
    return null;
  }
  return saveCharacterToDrive(false);
}
</script>

<style scoped>
.character-hub {
  display: flex;
  justify-content: center;
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
