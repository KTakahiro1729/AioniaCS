<template>
  <div class="load-modal">
    <div class="load-modal__header">
      <div class="load-modal__sub-actions">
        <label class="button-base button-base--ghost load-modal__sub-button load-modal__sub-button--compact">
          {{ loadLocalLabel }}
          <input type="file" class="hidden" accept=".json,.txt,.zip" @change="handleLocalChange" />
        </label>
        
        <button
          class="button-base button-base--ghost load-modal__sub-button load-modal__sub-button--compact"
          :disabled="!hasHistory"
          data-test="load-modal-history-button"
          @click="$emit('open-history')"
        >
          {{ restoreHistoryLabel }}
        </button>

        <div v-if="isSignedIn" class="load-modal__folder-controls">
          <button
            class="button-base button-base--ghost load-modal__sub-button load-modal__sub-button--compact load-modal__folder-toggle"
            :class="{ 'is-active': isFolderEditorOpen }"
            type="button"
            data-test="load-modal-folder-toggle"
            @click="toggleFolderEditor"
          >
            {{ driveFolderLabel }}
          </button>
        </div>
      </div>

      <div v-if="isSignedIn && isFolderEditorOpen" class="load-modal__folder-editor-overlay">
        <div class="load-modal__folder-editor">
          <div class="load-modal__input-group">
            <BaseInput
              :id="folderInputId"
              class="load-modal__input"
              type="text"
              v-model="folderPathInput"
              :placeholder="driveFolderPlaceholder"
              :disabled="isDriveControlsDisabled || isAwaitingFolderCreationChoice"
              :joined="'right'"
              @keyup.enter.prevent="commitFolderPath"
            />
            <button
              class="button-base button-base--primary load-modal__apply is-joined-left"
              type="button"
              :disabled="isDriveControlsDisabled || isAwaitingFolderCreationChoice"
              data-test="load-modal-apply-folder"
              @click="commitFolderPath"
            >
              {{ driveFolderChangeLabel }}
            </button>
          </div>
          <div v-if="isAwaitingFolderCreationChoice" class="load-modal__folder-confirm" role="status" aria-live="polite">
            <p class="load-modal__folder-confirm-text">{{ driveFolderCreateConfirmMessage }}</p>
            <div class="load-modal__folder-confirm-actions">
              <button
                class="button-base button-base--primary is-joined-right"
                type="button"
                :disabled="isDriveControlsDisabled"
                data-test="load-modal-folder-create-yes"
                @click="createAndApplyFolder"
              >
                {{ driveFolderCreateYesLabel }}
              </button>
              <button
                class="button-base button-base--ghost is-joined-left"
                type="button"
                :disabled="isDriveControlsDisabled"
                data-test="load-modal-folder-create-no"
                @click="cancelFolderCreatePrompt"
              >
                {{ driveFolderCreateNoLabel }}
              </button>
            </div>
          </div>
        </div>
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
import { ref, watch, computed } from 'vue';
import BaseInput from '@/shared/ui/base/BaseInput.vue';
import DriveLoadContent from '@/features/modals/components/contents/DriveLoadContent.vue';
import { getDriveManagerInstance } from '@/infrastructure/google-drive/index.js';

const props = defineProps({
  isSignedIn: Boolean,
  canSignIn: Boolean,
  isDriveReady: Boolean,
  driveFolderPath: String,
  driveFolderLabel: String,
  driveFolderChangeLabel: { type: String, default: 'Apply' },
  driveFolderPlaceholder: String,
  driveFolderCreateConfirmMessage: { type: String, default: '存在しないフォルダです。新しく作成しますか？' },
  driveFolderCreateYesLabel: { type: String, default: 'はい' },
  driveFolderCreateNoLabel: { type: String, default: 'いいえ' },
  loadLocalLabel: String,
  restoreHistoryLabel: String,
  loadCharacterFromDrive: Function,
  hasHistory: Boolean,
  signInLabel: String,
  signInMessage: String,
});

const emit = defineEmits(['load-local', 'sign-in', 'update-drive-folder-path', 'open-history']);

const folderInputId = 'load_modal_drive_folder';
const folderPathInput = ref(props.driveFolderPath || '');
const pendingFolderPath = ref('');
const isFolderEditorOpen = ref(false);
const isAwaitingFolderCreationChoice = ref(false);
const isApplyingFolder = ref(false);

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
      isFolderEditorOpen.value = false;
      isAwaitingFolderCreationChoice.value = false;
      isApplyingFolder.value = false;
    }
  },
);

const isDriveControlsDisabled = computed(() => !props.isSignedIn || isApplyingFolder.value);

function commitFolderPath() {
  if (!props.isSignedIn) {
    folderPathInput.value = props.driveFolderPath || '';
    return;
  }
  validateAndApplyFolderPath();
}

function toggleFolderEditor() {
  isFolderEditorOpen.value = !isFolderEditorOpen.value;
  if (!isFolderEditorOpen.value) {
    cancelFolderCreatePrompt();
    folderPathInput.value = props.driveFolderPath || '';
  }
}

function normalizePath(path, manager) {
  if (manager && typeof manager.normalizeFolderPath === 'function') {
    return manager.normalizeFolderPath(path);
  }
  if (typeof path !== 'string') {
    return '';
  }
  return path
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join('/');
}

async function ensureFolderPath(path, manager, createMissing = false) {
  const segments = normalizePath(path, manager).split('/').filter(Boolean);

  if (segments.length === 0) {
    return true;
  }

  if (!manager || typeof manager.findFolder !== 'function') {
    return false;
  }

  let parentId = 'root';
  for (const segment of segments) {
    let folder = await manager.findFolder(segment, parentId);
    if (!folder?.id) {
      if (!createMissing || typeof manager.createFolder !== 'function') {
        return false;
      }
      folder = await manager.createFolder(segment, parentId);
      if (!folder?.id) {
        return false;
      }
    }
    parentId = folder.id;
  }

  return true;
}

function resolveDriveManager() {
  try {
    return getDriveManagerInstance();
  } catch {
    return null;
  }
}

async function validateAndApplyFolderPath() {
  const manager = resolveDriveManager();
  if (!manager) {
    emit('update-drive-folder-path', folderPathInput.value);
    return;
  }

  const normalized = normalizePath(folderPathInput.value, manager);
  if (!normalized) {
    cancelFolderCreatePrompt();
    emit('update-drive-folder-path', normalized);
    isFolderEditorOpen.value = false;
    return;
  }

  try {
    const exists = await ensureFolderPath(normalized, manager, false);
    if (exists) {
      cancelFolderCreatePrompt();
      emit('update-drive-folder-path', normalized);
      isFolderEditorOpen.value = false;
      return;
    }
  } catch {
    cancelFolderCreatePrompt();
    folderPathInput.value = props.driveFolderPath || '';
    return;
  }

  pendingFolderPath.value = normalized;
  isAwaitingFolderCreationChoice.value = true;
}

function cancelFolderCreatePrompt() {
  pendingFolderPath.value = '';
  isAwaitingFolderCreationChoice.value = false;
}

async function createAndApplyFolder() {
  const manager = resolveDriveManager();
  const targetPath = normalizePath(pendingFolderPath.value || folderPathInput.value, manager);
  if (!targetPath) {
    return;
  }

  if (!manager) {
    cancelFolderCreatePrompt();
    emit('update-drive-folder-path', targetPath);
    return;
  }

  isApplyingFolder.value = true;
  try {
    const created = await ensureFolderPath(targetPath, manager, true);
    if (!created) {
      return;
    }
    cancelFolderCreatePrompt();
    emit('update-drive-folder-path', targetPath);
    isFolderEditorOpen.value = false;
  } finally {
    isApplyingFolder.value = false;
  }
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
  gap: 0;
  max-height: 72vh;
}

.load-modal * {
  min-width: 0;
}

.load-modal__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
}

.load-modal__sub-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.load-modal__sub-button {
  height: 36px;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.load-modal__sub-button--compact {
  height: 30px;
  padding: 4px 12px;
  font-size: 0.85rem;
  line-height: 1;
}

.load-modal__folder-editor-overlay {
  width: 100%;
  padding-top: 4px;
}

.load-modal__folder-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--color-panel-header);
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
}

.load-modal__input-group {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.load-modal__input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border-normal);
  background-color: var(--color-panel-body);
  color: var(--color-text-primary);
}

.load-modal__apply {
  flex: 0 0 auto;
  height: 36px;
  padding: 0 16px;
}

.load-modal__folder-confirm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.load-modal__folder-confirm-actions {
  display: flex;
  gap: 8px;
}

.load-modal__drive-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 14px 14px;
}

.load-modal__signin {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
  align-items: center;
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
