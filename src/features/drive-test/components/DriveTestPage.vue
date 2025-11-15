<script setup>
import { computed, ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useDataExport } from '@/features/character-sheet/composables/useDataExport.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';

const uiStore = useUiStore();
const { dataManager } = useDataExport();
const { isAuthenticated, isLoading, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

const { isDriveReady, updateDriveFolderPath } = useGoogleDrive(dataManager);

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
const newFolderPath = ref(uiStore.driveFolderPath);
const folderUpdateStatus = ref('');
const filesStatus = ref('');
const listedFiles = ref(null);

watch(
  () => uiStore.driveFolderPath,
  (current) => {
    if (current && current !== newFolderPath.value) {
      newFolderPath.value = current;
    }
  },
  { immediate: true },
);

const driveStateLabel = computed(() => (isDriveReady.value ? '準備完了' : '未準備'));
const userInfo = computed(() => (user.value ? JSON.stringify(user.value, null, 2) : '未取得'));
const canShowDriveControls = computed(() => isDriveReady.value);

function handleLogin() {
  loginWithRedirect();
}

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin + '/drive-test' } });
}

async function handleFolderUpdate() {
  folderUpdateStatus.value = '更新中...';
  try {
    const updated = await updateDriveFolderPath(newFolderPath.value || '');
    folderUpdateStatus.value = `更新成功: ${updated}`;
    console.info('[DriveTest] Folder path updated', updated);
  } catch (error) {
    console.error('[DriveTest] Failed to update folder path', error);
    folderUpdateStatus.value = `エラー: ${error?.message || error}`;
  }
}

async function resolveAccessToken() {
  if (useMockDrive) {
    return 'mock-access-token';
  }
  if (!isAuthenticated.value) {
    throw new Error('ログインが必要です');
  }
  const authorizationParams = {};
  const audience = import.meta.env.VITE_AUTH0_API_AUDIENCE;
  const scope = import.meta.env.VITE_AUTH0_DRIVE_SCOPE;
  if (audience) {
    authorizationParams.audience = audience;
  }
  if (scope) {
    authorizationParams.scope = scope;
  }
  const tokenResult = await getAccessTokenSilently({
    ...(Object.keys(authorizationParams).length ? { authorizationParams } : {}),
    detailedResponse: true,
  });
  const accessToken =
    (typeof tokenResult === 'object' && tokenResult?.resource_server?.access_token) ||
    (typeof tokenResult === 'string' ? tokenResult : tokenResult?.access_token);
  if (!accessToken) {
    throw new Error('アクセストークンの取得に失敗しました');
  }
  return accessToken;
}

function getDriveManager() {
  try {
    return getGoogleDriveManagerInstance();
  } catch (error) {
    console.error('[DriveTest] Google Drive manager is not available', error);
    return null;
  }
}

async function handleListFiles() {
  filesStatus.value = '取得中...';
  listedFiles.value = null;
  const driveManager = getDriveManager();
  if (!driveManager) {
    filesStatus.value = 'Drive Manager が初期化されていません';
    return;
  }
  try {
    const accessToken = await resolveAccessToken();
    const folderId = await driveManager.ensureConfiguredFolder(accessToken);
    const files = await driveManager.listFiles(accessToken, folderId);
    listedFiles.value = files;
    filesStatus.value = `取得成功: ${files?.length || 0} 件`;
    console.info('[DriveTest] Drive files', files);
  } catch (error) {
    console.error('[DriveTest] Failed to fetch files', error);
    filesStatus.value = `エラー: ${error?.message || error}`;
  }
}
</script>

<template>
  <div class="drive-test-page">
    <header>
      <h1>Google Drive 連携テスト</h1>
      <p class="note">このページは開発環境専用です。</p>
    </header>

    <section class="auth-section">
      <h2>Auth0 状態</h2>
      <ul>
        <li>isLoading: {{ isLoading }}</li>
        <li>isAuthenticated: {{ isAuthenticated }}</li>
        <li>ユーザー情報:</li>
      </ul>
      <pre class="json-view">{{ userInfo }}</pre>
      <div class="button-row">
        <button type="button" @click="handleLogin" :disabled="isLoading || isAuthenticated">ログイン</button>
        <button type="button" @click="handleLogout" :disabled="isLoading || !isAuthenticated">ログアウト</button>
      </div>
    </section>

    <section class="drive-section">
      <h2>Google Drive 状態</h2>
      <p>isDriveReady: {{ driveStateLabel }}</p>
    </section>

    <section v-if="canShowDriveControls" class="drive-controls">
      <h3>フォルダパス設定</h3>
      <label class="field">
        <span>現在のフォルダパス</span>
        <input type="text" :value="uiStore.driveFolderPath" readonly />
      </label>
      <label class="field">
        <span>新しいフォルダパス</span>
        <input v-model="newFolderPath" type="text" />
      </label>
      <div class="button-row">
        <button type="button" @click="handleFolderUpdate">フォルダパス更新</button>
      </div>
      <p class="status" v-if="folderUpdateStatus">{{ folderUpdateStatus }}</p>

      <h3>ファイルリスト取得</h3>
      <div class="button-row">
        <button type="button" @click="handleListFiles">ファイルリスト取得</button>
      </div>
      <p class="status" v-if="filesStatus">{{ filesStatus }}</p>
      <pre v-if="listedFiles" class="json-view">{{ JSON.stringify(listedFiles, null, 2) }}</pre>
    </section>

    <section v-else class="drive-section">
      <p>Google Drive を操作するには認証が必要です。</p>
    </section>
  </div>
</template>

<style scoped>
.drive-test-page {
  max-width: 720px;
  margin: 2rem auto;
  padding: 2rem;
  background: #1f1f1f;
  color: #f1f1f1;
  border-radius: 1rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  font-family: 'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
}

.note {
  color: #f0bb50;
  margin-top: 0.5rem;
}

section + section {
  margin-top: 1.5rem;
}

.auth-section ul {
  list-style: none;
  padding: 0;
  margin: 0 0 0.5rem;
}

.json-view {
  background: #121212;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  white-space: pre-wrap;
}

.button-row {
  display: flex;
  gap: 1rem;
  margin-top: 0.75rem;
}

.button-row button {
  flex: 1;
  padding: 0.75rem 1rem;
  background: #5c2a7d;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.button-row button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.field input {
  padding: 0.5rem 0.75rem;
  border-radius: 0.4rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
}

.status {
  margin-top: 0.5rem;
  color: #f0bb50;
}
</style>
