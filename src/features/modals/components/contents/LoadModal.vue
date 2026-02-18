<template>
  <div class="load-modal">
    <!-- ヘッダー行: 未ログイン時はサインイン案内、ログイン時はサブアクションボタン -->
    <div class="load-modal__header">
      <template v-if="!isSignedIn">
        <p class="load-modal__signin-message">{{ signInMessage }}</p>
        <button
          class="button-base load-modal__signin-button"
          :disabled="!canSignIn"
          data-test="load-modal-signin"
          @click="$emit('sign-in')"
        >
          {{ signInLabel }}
        </button>
      </template>
      <template v-else>
        <div class="load-modal__sub-actions">
          <label class="button-base button-base--ghost load-modal__sub-button">
            {{ loadLocalLabel }}
            <input type="file" class="hidden" accept=".json,.txt,.zip" @change="handleLocalChange" />
          </label>
          <button
            class="button-base button-base--ghost load-modal__sub-button"
            :disabled="!hasHistory"
            data-test="load-modal-history-button"
            @click="$emit('open-history')"
          >
            {{ restoreHistoryLabel }}
          </button>
        </div>
      </template>
    </div>

    <!-- フォルダ設定: ログイン時のみ -->
    <div v-if="isSignedIn" class="load-modal__folder">
      <label class="load-modal__folder-label" :for="folderInputId">{{ driveFolderLabel }}</label>
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

    <!-- ドライブリスト -->
    <div class="load-modal__drive-scroll">
      <DriveLoadContent
        v-if="isSignedIn"
        :is-signed-in="isSignedIn"
        :is-drive-ready="isDriveReady"
        :load-character-from-drive="loadCharacterFromDrive"
      />
      <p v-else class="load-modal__drive-hint">{{ signInMessage }}</p>
    </div>
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
  gap: 0;
  max-height: 70vh;
}

/* ヘッダー行 */
.load-modal__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-normal);
  flex-wrap: wrap;
}

/* 未ログイン時: メッセージとボタンを縦並び */
.load-modal__signin-message {
  flex: 1 1 100%;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.load-modal__signin-button {
  width: 100%;
  justify-content: center;
}

/* ログイン時: サブアクションボタン群を右寄せ */
.load-modal__sub-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-left: auto;
}

.load-modal__sub-button {
  font-size: 0.8rem;
  padding: 4px 10px;
  height: 30px;
  line-height: 1;
  white-space: nowrap;
}

/* フォルダ設定エリア */
.load-modal__folder {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border-normal);
}

.load-modal__folder-label {
  font-size: 0.9rem;
  font-weight: 600;
}

/* フォルダ入力グループ */
.load-modal__input-group {
  display: flex;
  align-items: stretch;
}

.load-modal__input {
  flex: 1 1 0;
  min-width: 0;
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

/* ドライブスクロール領域 */
.load-modal__drive-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.load-modal__drive-hint {
  margin: 0;
  padding: 16px 14px;
  color: var(--color-text-muted);
  text-align: center;
}

/* hiddenファイル入力 */
.hidden {
  display: none;
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
