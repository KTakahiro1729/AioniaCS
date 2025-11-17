<script setup>
import { computed, ref } from 'vue';
import { useAuth0Client } from '@/app/providers/useAuth0Client.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useDataExport } from '@/features/character-sheet/composables/useDataExport.js';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
import { fetchDriveAccessTokenFromAuth0 } from '@/features/cloud-sync/services/auth0DriveTokenClient.js';

const { dataManager } = useDataExport();
const uiStore = useUiStore();
const {
  canSignInToGoogle,
  isDriveReady,
  handleSignInClick,
  handleSignOutClick,
  refreshDriveFolderPath,
} = useGoogleDrive(dataManager);
const auth0Client = useAuth0Client();
const tokenPreview = ref(null);
const tokenError = ref(null);

const driveManager = computed(() => {
  try {
    return getGoogleDriveManagerInstance();
  } catch (error) {
    console.warn('Drive manager not initialized yet:', error);
    return null;
  }
});

const authUser = computed(() => auth0Client.user.value || {});
const isAuthenticated = computed(() => auth0Client.isAuthenticated.value);
const isAuthLoading = computed(() => auth0Client.isLoading.value);

const driveState = computed(() => ({
  isGapiInitialized: uiStore.isGapiInitialized,
  isGisInitialized: uiStore.isGisInitialized,
  driveFolderPath: uiStore.driveFolderPath,
  currentDriveFileId: uiStore.currentDriveFileId,
  hasDriveToken: !!uiStore.driveAccessToken,
  isSignedIn: uiStore.isSignedIn,
  pickerReady: !!driveManager.value?.pickerApiLoaded,
}));

async function fetchAuth0AccessToken() {
  tokenError.value = null;
  tokenPreview.value = null;
  try {
    tokenPreview.value = await auth0Client.getAccessToken({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email offline_access',
      },
    });
  } catch (error) {
    tokenError.value = error?.message || 'Failed to fetch Auth0 token.';
  }
}

async function refreshDriveTokenViaAuth0() {
  tokenError.value = null;
  try {
    const driveToken = await fetchDriveAccessTokenFromAuth0(auth0Client.getAccessToken);
    if (driveToken && driveManager.value) {
      await driveManager.value.applyExternalAccessToken(driveToken);
    }
    uiStore.setDriveAccessToken(driveToken || null);
    tokenPreview.value = driveToken;
  } catch (error) {
    tokenError.value = error?.message || 'Failed to refresh Drive token via Auth0.';
  }
}

async function reapplyStoredToken() {
  if (driveManager.value && uiStore.driveAccessToken) {
    await driveManager.value.applyExternalAccessToken(uiStore.driveAccessToken);
  }
}
</script>

<template>
  <div class="debug-page">
    <h1>Auth0 / Drive Debug Console</h1>
    <p class="hint">App 本体は App.vue に触れず、ルーター経由でこのページにアクセスできます。</p>

    <section class="panel">
      <header class="panel__header">
        <div>
          <p class="panel__title">Auth0 セッション</p>
          <p class="panel__subtitle">ログイン/ログアウト、アクセストークン取得の確認</p>
        </div>
        <div class="panel__actions">
          <button type="button" class="button" :disabled="isAuthLoading" @click="auth0Client.loginWithRedirect">
            Auth0 でログイン
          </button>
          <button type="button" class="button button--ghost" :disabled="!isAuthenticated" @click="auth0Client.logout">
            Auth0 からログアウト
          </button>
          <button type="button" class="button" :disabled="isAuthLoading" @click="fetchAuth0AccessToken">
            アクセストークン取得
          </button>
        </div>
      </header>
      <div class="panel__content">
        <div class="grid grid--two">
          <div>
            <p class="label">状態</p>
            <p class="value">{{ isAuthLoading ? 'loading...' : isAuthenticated ? 'authenticated' : 'anonymous' }}</p>
          </div>
          <div>
            <p class="label">ユーザー</p>
            <p class="value">
              <span v-if="authUser?.email">{{ authUser.email }}</span>
              <span v-else class="muted">未ログイン</span>
            </p>
          </div>
        </div>
        <div class="token-box" v-if="tokenPreview">
          <p class="label">取得済みトークン</p>
          <pre>{{ tokenPreview }}</pre>
        </div>
        <p v-if="tokenError" class="error">{{ tokenError }}</p>
      </div>
    </section>

    <section class="panel">
      <header class="panel__header">
        <div>
          <p class="panel__title">Drive / Picker ステータス</p>
          <p class="panel__subtitle">Auth0 セッションを前提に GAPI/GIS・Picker の準備状況を確認</p>
        </div>
        <div class="panel__actions">
          <button type="button" class="button" :disabled="!canSignInToGoogle" @click="handleSignInClick">
            Drive を Auth0 経由で初期化
          </button>
          <button type="button" class="button button--ghost" :disabled="!driveState.isSignedIn" @click="handleSignOutClick">
            Drive からサインアウト
          </button>
          <button type="button" class="button" :disabled="!driveState.hasDriveToken" @click="refreshDriveFolderPath">
            フォルダ設定を再読込
          </button>
        </div>
      </header>
      <div class="panel__content">
        <div class="grid grid--three">
          <div>
            <p class="label">GAPI</p>
            <p class="value" :class="{ 'value--ok': driveState.isGapiInitialized }">
              {{ driveState.isGapiInitialized ? 'initialized' : 'pending' }}
            </p>
          </div>
          <div>
            <p class="label">GIS</p>
            <p class="value" :class="{ 'value--ok': driveState.isGisInitialized }">
              {{ driveState.isGisInitialized ? 'initialized' : 'pending' }}
            </p>
          </div>
          <div>
            <p class="label">Picker</p>
            <p class="value" :class="{ 'value--ok': driveState.pickerReady }">
              {{ driveState.pickerReady ? 'ready' : 'pending' }}
            </p>
          </div>
        </div>
        <div class="grid grid--two">
          <div>
            <p class="label">Drive トークン</p>
            <p class="value" :class="{ 'value--ok': driveState.hasDriveToken }">
              {{ driveState.hasDriveToken ? 'available' : 'missing' }}
            </p>
          </div>
          <div>
            <p class="label">サインイン状態</p>
            <p class="value">{{ driveState.isSignedIn ? 'signed-in' : 'signed-out' }}</p>
          </div>
        </div>
        <div class="grid grid--two">
          <div>
            <p class="label">キャラクターフォルダ</p>
            <p class="value">{{ driveState.driveFolderPath }}</p>
          </div>
          <div>
            <p class="label">カレントファイル</p>
            <p class="value">{{ driveState.currentDriveFileId || '---' }}</p>
          </div>
        </div>
        <div class="panel__actions">
          <button type="button" class="button" :disabled="!isDriveReady" @click="reapplyStoredToken">
            Drive トークンを GAPI に再適用
          </button>
          <button type="button" class="button" :disabled="!isAuthenticated" @click="refreshDriveTokenViaAuth0">
            Auth0 M2M 経由で Drive トークン再取得
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.debug-page {
  color: #f5f5f5;
  background: #0f1115;
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
}

.hint {
  margin: 0;
  color: #b5b7c0;
  font-size: 0.95rem;
}

.panel {
  border: 1px solid #1f2430;
  border-radius: 12px;
  background: linear-gradient(135deg, #131722, #0f1118);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.panel__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #1f2430;
  align-items: center;
}

.panel__title {
  margin: 0;
  font-weight: 700;
  font-size: 1.1rem;
}

.panel__subtitle {
  margin: 0.1rem 0 0;
  color: #9ca3af;
  font-size: 0.95rem;
}

.panel__content {
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.button {
  background: #36406a;
  color: #f7f9fb;
  border: none;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: background 0.2s ease;
}

.button:hover:not(:disabled) {
  background: #46528a;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button--ghost {
  background: transparent;
  border: 1px solid #36406a;
}

.grid {
  display: grid;
  gap: 0.75rem;
}

.grid--two {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.grid--three {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.label {
  margin: 0;
  color: #b1b5c4;
  font-size: 0.9rem;
}

.value {
  margin: 0.15rem 0 0;
  font-weight: 700;
}

.value--ok {
  color: #8ef4c1;
}

.muted {
  color: #7a7f8c;
}

.token-box {
  border: 1px solid #1f2430;
  border-radius: 8px;
  padding: 0.75rem;
  background: #0c0e12;
}

.token-box pre {
  margin: 0.25rem 0 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.error {
  color: #f4a6a6;
  margin: 0;
}
</style>
