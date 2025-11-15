<script setup>
import { computed, ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useDataExport } from '@/features/character-sheet/composables/useDataExport.js';

const uiStore = useUiStore();
const { dataManager } = useDataExport();
const { isDriveReady, loadCharacterFromDrive, saveCharacterToDrive, refreshDriveFolderPath, updateDriveFolderPath } =
  useGoogleDrive(dataManager);

const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
const authState = computed(() => ({
  isAuthenticated: isAuthenticated.value,
  isLoading: isLoading.value,
  user: user.value,
}));

const driveFolderInput = ref(uiStore.driveFolderPath || '');

watch(
  () => uiStore.driveFolderPath,
  (path) => {
    driveFolderInput.value = path || '';
  },
  { immediate: true },
);

function handleLogin() {
  loginWithRedirect();
}

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } });
}

function handleOverwriteSave() {
  return saveCharacterToDrive(false);
}

function handleNewSave() {
  return saveCharacterToDrive(true);
}

function handleFolderUpdate() {
  return updateDriveFolderPath(driveFolderInput.value);
}
</script>

<template>
  <div class="drive-test-page">
    <h1>Google Drive Debug Page</h1>

    <section class="card">
      <h2>Auth0 状態</h2>
      <p><strong>isAuthenticated:</strong> {{ authState.isAuthenticated ? 'true' : 'false' }}</p>
      <p><strong>isLoading:</strong> {{ authState.isLoading ? 'true' : 'false' }}</p>
      <pre class="user-info">{{ authState.user ? JSON.stringify(authState.user, null, 2) : 'ユーザー情報なし' }}</pre>
      <div class="button-row">
        <button type="button" @click="handleLogin">ログイン</button>
        <button type="button" @click="handleLogout">ログアウト</button>
      </div>
    </section>

    <section class="card">
      <h2>Google Drive 操作</h2>
      <p><strong>isDriveReady:</strong> {{ isDriveReady ? 'true' : 'false' }}</p>
      <div class="button-grid">
        <button type="button" @click="loadCharacterFromDrive">Driveからロード</button>
        <button type="button" @click="handleOverwriteSave">Driveに保存（上書き/確認）</button>
        <button type="button" @click="handleNewSave">Driveに新規保存</button>
        <button type="button" @click="refreshDriveFolderPath">フォルダパス更新（読み込み）</button>
      </div>
      <div class="folder-path">
        <label for="drive-folder-input">フォルダパス</label>
        <input id="drive-folder-input" v-model="driveFolderInput" type="text" placeholder="例: characters/aionia" />
        <p class="current-path"><strong>現在のパス:</strong> {{ uiStore.driveFolderPath || '(未設定)' }}</p>
        <button type="button" @click="handleFolderUpdate">フォルダパス設定（書き込み）</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drive-test-page {
  padding: 2rem;
  color: #f3f3f3;
  background: #1a1a1a;
  min-height: 100vh;
  font-family: 'Noto Sans JP', sans-serif;
}

h1 {
  margin-bottom: 1.5rem;
}

.card {
  background: #242424;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

h2 {
  margin-bottom: 1rem;
}

.button-row,
.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.button-grid button {
  flex: 1 1 220px;
}

button {
  padding: 0.6rem 1rem;
  border-radius: 4px;
  border: 1px solid #5c5c5c;
  background: #333;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover {
  background: #3f3f3f;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-info {
  background: #121212;
  border: 1px solid #333;
  padding: 0.75rem;
  border-radius: 6px;
  max-height: 200px;
  overflow: auto;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.folder-path {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input[type='text'] {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #555;
  background: #0f0f0f;
  color: #f3f3f3;
}

.current-path {
  font-size: 0.9rem;
  color: #cfcfcf;
}
</style>
