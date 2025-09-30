<template>
  <div class="character-hub">
    <header class="character-hub__header">
      <div class="character-hub__summary">
        <p v-if="uiStore.isSignedIn" class="character-hub__summary-text">
          <span class="character-hub__folder-label">{{ workspaceLabel }}</span>
          <span v-if="!uiStore.driveFolderId" class="character-hub__folder-warning">{{ workspaceUnsetMessage }}</span>
        </p>
        <p v-else class="character-hub__summary-text">
          {{ signedOutMessage }}
        </p>
      </div>
      <CharacterHubControls
        :labels="controlLabels"
        @sign-in="emit('sign-in')"
        @sign-out="emit('sign-out')"
        @refresh="refreshList"
        @save-new="saveNew"
        @save-current="handleSaveCurrent"
        @change-folder="emit('change-folder')"
        @open-picker="openDrivePicker"
      />
    </header>
    <section v-if="uiStore.isSignedIn" class="character-hub__body">
      <p v-if="characters.length === 0" class="character-hub__empty">{{ emptyMessage }}</p>
      <ul v-else class="character-hub__list">
        <li
          v-for="ch in characters"
          :key="ch.id"
          :class="['character-hub__item', { 'character-hub__item--active': ch.id === uiStore.currentDriveFileId }]"
        >
          <div class="character-hub__item-main">
            <button class="character-hub__name" @click="confirmLoad(ch)">
              {{ ch.characterName || fallbackName }}
            </button>
            <span class="character-hub__date">{{ formatUpdatedAt(ch.updatedAt) }}</span>
          </div>
          <div v-if="characterToDelete && characterToDelete.id === ch.id" class="character-hub__confirm">
            <p class="character-hub__confirm-text">{{ deleteConfirmation }}</p>
            <div class="character-hub__confirm-actions">
              <button class="button-base button-compact" @click="executeDelete">{{ actionLabels.remove }}</button>
              <button class="button-base button-compact button-secondary" @click="cancelDelete">
                {{ actionLabels.cancel }}
              </button>
            </div>
          </div>
          <div v-else class="character-hub__actions">
            <button class="button-base button-compact" @click="overwrite(ch)">{{ actionLabels.overwrite }}</button>
            <button class="button-base button-compact" @click="exportLocal(ch)">{{ actionLabels.export }}</button>
            <button class="button-base button-compact" @click="startDelete(ch)">{{ actionLabels.remove }}</button>
          </div>
        </li>
      </ul>
    </section>
    <section v-else class="character-hub__signed-out">
      <p class="character-hub__description">{{ signedOutMessage }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CharacterHubControls from './CharacterHubControls.vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { useModal } from '../../composables/useModal.js';
import { messages } from '../../locales/ja.js';

const props = defineProps({
  dataManager: { type: Object, required: true },
  loadCharacter: { type: Function, required: true },
  saveToDrive: { type: Function, required: true },
});

const emit = defineEmits(['sign-in', 'sign-out', 'change-folder']);

const uiStore = useUiStore();
const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();

const characterToDelete = ref(null);
const fallbackName = messages.characterHub.fallbackName;

const controlLabels = messages.characterHub.controls;
const actionLabels = messages.characterHub.list.actions;
const deleteConfirmation = messages.characterHub.list.deletePrompt;
const signedOutMessage = messages.characterHub.signedOutMessage;
const emptyMessage = messages.characterHub.emptyMessage;
const workspaceUnsetMessage = messages.characterHub.workspaceUnset;

const characters = computed(() =>
  [...uiStore.driveCharacters].sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  }),
);

const workspaceLabel = computed(() => {
  if (!uiStore.isSignedIn) {
    return signedOutMessage;
  }
  if (!uiStore.driveFolderId) {
    return messages.characterHub.workspaceLabel(messages.characterHub.defaultFolderName);
  }
  const name = uiStore.driveFolderName || messages.characterHub.defaultFolderName;
  return messages.characterHub.workspaceLabel(name);
});

onMounted(async () => {
  if (uiStore.isSignedIn && uiStore.driveCharacters.length === 0 && props.dataManager.googleDriveManager) {
    await uiStore.refreshDriveCharacters(props.dataManager.googleDriveManager);
  }
});

function refreshList() {
  props.dataManager.loadCharacterListFromDrive().then((list) => (uiStore.driveCharacters = list));
}

async function saveNew() {
  if (props.saveToDrive) {
    await props.saveToDrive(null);
  }
}

async function handleSaveCurrent() {
  if (props.saveToDrive) {
    await props.saveToDrive(uiStore.currentDriveFileId);
  }
}

async function overwrite(ch) {
  if (props.saveToDrive) {
    await props.saveToDrive(ch.id);
  }
}

function formatUpdatedAt(date) {
  if (!date) return '';
  const text = new Date(date).toLocaleString();
  return messages.characterHub.list.updatedAt(text);
}

async function confirmLoad(ch) {
  const result = await showModal(messages.characterHub.loadConfirm(ch.characterName || fallbackName));
  if (result.value === 'load') {
    await props.loadCharacter(ch.id, ch.characterName || fallbackName);
  }
}

function startDelete(ch) {
  characterToDelete.value = ch;
}

function cancelDelete() {
  characterToDelete.value = null;
}

async function executeDelete() {
  const ch = characterToDelete.value;
  if (!ch) return;

  if (props.dataManager.googleDriveManager) {
    if (ch.id.startsWith('temp-')) {
      uiStore.cancelPendingDriveSave(ch.id);
      uiStore.removeDriveCharacter(ch.id);
      showToast({ type: 'success', ...messages.characterHub.delete.successToast() });
    } else {
      const previous = [...uiStore.driveCharacters];
      uiStore.removeDriveCharacter(ch.id);
      const deletePromise = props.dataManager.googleDriveManager.deleteCharacterFile(ch.id).catch((err) => {
        uiStore.driveCharacters = previous;
        throw err;
      });
      showAsyncToast(deletePromise, {
        loading: messages.characterHub.delete.asyncToast.loading(),
        success: messages.characterHub.delete.asyncToast.success(),
        error: (err) => messages.characterHub.delete.asyncToast.error(err),
      });
      await deletePromise;
    }
  }

  characterToDelete.value = null;
}

async function exportLocal(ch) {
  const gdm = props.dataManager.googleDriveManager;
  if (!gdm) return;
  const exportPromise = gdm.loadCharacterFile(ch.id).then(async (data) => {
    if (data) {
      await props.dataManager.saveData(data.character, data.skills, data.specialSkills, data.equipments, data.histories);
    }
  });
  showAsyncToast(exportPromise, {
    loading: messages.characterHub.export.loading(),
    success: messages.characterHub.export.success(),
    error: (err) => messages.characterHub.export.error(err),
  });
}

function openDrivePicker() {
  const gdm = props.dataManager.googleDriveManager;
  if (!gdm) return;
  gdm.showFilePicker(async (err, file) => {
    if (err || !file) {
      if (err && err.message && err.message !== 'Picker cancelled by user.') {
        showToast({ type: 'error', ...messages.googleDrive.load.error(err) });
      }
      return;
    }
    await props.loadCharacter(file.id, file.name);
  }, uiStore.driveFolderId, ['application/json']);
}
</script>

<style scoped>
.character-hub {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.character-hub__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-hub__summary-text {
  margin: 0;
  color: var(--color-text-muted);
}

.character-hub__folder-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.character-hub__folder-warning {
  display: block;
  margin-top: 4px;
  color: var(--color-warning-light);
}

.character-hub__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.character-hub__empty {
  margin: 0;
  color: var(--color-text-muted);
  text-align: center;
}

.character-hub__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.character-hub__item {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  background-color: var(--color-panel);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.character-hub__item--active {
  border-color: var(--color-accent);
  box-shadow: 0 0 8px rgba(140, 120, 255, 0.35);
}

.character-hub__item-main {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.character-hub__name {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-accent-light);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.character-hub__name:hover {
  text-decoration: underline;
}

.character-hub__date {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.character-hub__actions {
  display: flex;
  gap: 6px;
}

.character-hub__confirm {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.character-hub__confirm-text {
  margin: 0;
}

.character-hub__confirm-actions {
  display: flex;
  gap: 8px;
}

.character-hub__signed-out {
  text-align: center;
}

.character-hub__description {
  margin: 0 auto;
  max-width: 420px;
  color: var(--color-text-muted);
}

.button-compact {
  padding: 4px 8px;
  font-size: 0.85rem;
}
</style>
