<script setup>
import { ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { AioniaGameData } from '@/data/gameData.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';

const dataManager = new DataManager(AioniaGameData);
const uiStore = useUiStore();
const characterStore = useCharacterStore();
const { isAuthenticated, isLoading } = useAuth0();

const {
  isDriveReady,
  promptForDriveFolder,
  refreshDriveFolderPath,
  updateDriveFolderPath,
  loadCharacterFromDrive,
  saveCharacterToDrive,
  handleSaveToDriveClick,
} = useGoogleDrive(dataManager);

const folderPathInput = ref('');
const promptResult = ref('');
const lastUpdateResult = ref('');

watch(
  () => uiStore.driveFolderPath,
  (newPath) => {
    folderPathInput.value = newPath || '';
  },
  { immediate: true },
);

async function handleFolderPrompt() {
  const result = await promptForDriveFolder();
  promptResult.value = result || '';
}

async function handleFolderPathUpdate() {
  const updatedPath = await updateDriveFolderPath(folderPathInput.value);
  if (updatedPath) {
    lastUpdateResult.value = `更新済み: ${updatedPath}`;
  } else {
    lastUpdateResult.value = '更新結果なし';
  }
}

async function handleLoadClick() {
  await loadCharacterFromDrive();
}

async function handleSaveNewClick() {
  await saveCharacterToDrive(true);
}

async function handleOverwriteClick() {
  await handleSaveToDriveClick();
}
</script>

<template>
  <div class="google-drive-test-page">
    <h1>Google Drive Test Page</h1>

    <section>
      <h2>状態</h2>
      <p>Drive Ready: {{ isDriveReady }}</p>
      <p>Authenticated: {{ isAuthenticated }}</p>
      <p>Auth Loading: {{ isLoading }}</p>
      <p>現在のDriveフォルダ: {{ uiStore.driveFolderPath || '未設定' }}</p>
      <p>現在のDriveファイルID: {{ uiStore.currentDriveFileId || '未保存' }}</p>
    </section>

    <section>
      <h2>フォルダ設定</h2>
      <button type="button" @click="refreshDriveFolderPath">リフレッシュ</button>
      <div>
        <label>
          フォルダパス
          <input v-model="folderPathInput" placeholder="characters/" />
        </label>
        <button type="button" @click="handleFolderPathUpdate">更新</button>
      </div>
      <p>更新結果: {{ lastUpdateResult || '未実行' }}</p>
      <button type="button" @click="handleFolderPrompt">フォルダ選択</button>
      <p>フォルダ選択結果: {{ promptResult || '未実行' }}</p>
    </section>

    <section>
      <h2>キャラクター情報</h2>
      <label>
        キャラクター名
        <input v-model="characterStore.character.name" placeholder="キャラクター名" />
      </label>
      <p>現在のキャラクター名: {{ characterStore.character.name || '未設定' }}</p>
    </section>

    <section>
      <h2>ファイルI/O</h2>
      <button type="button" @click="handleLoadClick">Driveからロード</button>
      <button type="button" @click="handleSaveNewClick">Driveへ新規保存</button>
      <button type="button" @click="handleOverwriteClick">Driveへ上書き/検索保存</button>
    </section>
  </div>
</template>
