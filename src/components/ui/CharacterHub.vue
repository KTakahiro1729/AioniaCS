<template>
  <div class="character-hub">
    <div v-if="!isAuthenticated" class="auth-section">
      <h2>クラウド同期にはログインが必要です</h2>
      <p>
        Cloudflare R2 に保存されたキャラクターデータを利用するには、アカウントにログインしてください。
      </p>
      <button class="button-base login-button" @click="handleLogin">ログイン / 新規登録</button>
    </div>

    <div v-else class="hub-content">
      <header class="hub-header">
        <div class="hub-header__text">
          <h2 class="hub-title">クラウドキャラクターハブ</h2>
          <p class="hub-description">
            Cloudflare R2 に保存されたキャラクターの保存・読込・エクスポートをここで管理できます。
          </p>
        </div>
        <div class="account-info">
          <span class="user-name">{{ user.name }}</span>
          <button class="button-base button-compact logout-button" @click="handleLogout">ログアウト</button>
        </div>
      </header>

      <section class="hub-actions" aria-label="クラウド操作">
        <button class="button-base button-compact" @click="saveNew">クラウドに新規保存</button>
        <button class="button-base button-compact button-secondary" @click="refreshList">一覧を更新</button>
      </section>

      <section class="hub-list" aria-label="保存済みキャラクター">
        <header class="hub-list__header">
          <h3 class="hub-list__title">保存済みキャラクター</h3>
          <span class="hub-list__count">全 {{ characters.length }} 件</span>
        </header>

        <p v-if="characters.length === 0" class="hub-empty">
          まだクラウドに保存されたキャラクターはありません。現在のシートを保存してクラウド同期を開始しましょう。
        </p>

        <ul v-else class="character-hub--list">
          <li
            v-for="ch in characters"
            :key="ch.id"
            :class="['character-hub--item', { 'character-hub--item--highlighted': ch.id === uiStore.currentDriveFileId }]"
          >
            <div class="character-hub--item-main">
              <button class="character-hub--name" @click="confirmLoad(ch)">
                {{ ch.characterName || '名もなき冒険者' }}
              </button>
              <span class="character-hub--date">{{ formatDate(ch.updatedAt) }}</span>
            </div>
            <div v-if="characterToDelete && characterToDelete.id === ch.id" class="character-hub--actions-container">
              <p class="character-hub--confirmation-message">本当に削除しますか？</p>
              <div class="character-hub--confirmation-actions">
                <button class="button-base button-compact" @click="executeDelete">はい</button>
                <button class="button-base button-compact button-secondary" @click="cancelDelete">いいえ</button>
              </div>
            </div>
            <div v-else class="character-hub--actions-container">
              <div class="character-hub--actions-inline" aria-label="保存データに対する操作">
                <button class="button-base button-compact" @click="overwrite(ch)">クラウドを上書き</button>
                <button class="button-base button-compact" @click="exportLocal(ch)">端末へ保存</button>
                <button class="button-base button-compact" @click="startDelete(ch)">削除</button>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { useModal } from '../../composables/useModal.js';
import { messages } from '../../locales/ja.js';

const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

const handleLogin = () => {
  loginWithRedirect();
};

const handleLogout = () => {
  logout({ logoutParams: { returnTo: window.location.origin } });
};

const props = defineProps({
  dataManager: Object,
  loadCharacter: Function,
  saveToDrive: Function,
});

const characterToDelete = ref(null);

const uiStore = useUiStore();
const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();

const characters = computed(() =>
  [...uiStore.driveCharacters].sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  }),
);

onMounted(() => {
  if (isAuthenticated.value) {
    ensureCharacters();
  }
});

async function ensureCharacters() {
  if (isAuthenticated.value && uiStore.driveCharacters.length === 0) {
    await uiStore.refreshDriveCharacters(props.dataManager);
  }
}

function refreshList() {
  return uiStore.refreshDriveCharacters(props.dataManager);
}

async function saveNew() {
  if (props.saveToDrive) {
    await props.saveToDrive(null);
  }
}

async function overwrite(ch) {
  if (props.saveToDrive) {
    await props.saveToDrive(ch.id);
  }
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

async function confirmLoad(ch) {
  const result = await showModal(messages.characterHub.loadConfirm(ch.characterName));
  if (result.value === 'load') {
    await props.loadCharacter(ch.id, ch.characterName);
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

  if (ch.id.startsWith('temp-')) {
    uiStore.cancelPendingDriveSave(ch.id);
    uiStore.removeDriveCharacter(ch.id);
    showToast({ type: 'success', ...messages.characterHub.delete.successToast() });
  } else {
    const previous = [...uiStore.driveCharacters];
    uiStore.removeDriveCharacter(ch.id);
    const deletePromise = props.dataManager.deleteCloudCharacter(ch.id).catch((err) => {
      uiStore.driveCharacters = previous;
      throw err;
    });
    showAsyncToast(deletePromise, {
      loading: messages.characterHub.delete.asyncToast.loading(),
      success: messages.characterHub.delete.asyncToast.success(),
      error: (err) => messages.characterHub.delete.asyncToast.error(err),
    });
    await deletePromise;
    await refreshList();
  }

  characterToDelete.value = null;
}

async function exportLocal(ch) {
  const exportPromise = props.dataManager.loadCloudCharacter(ch.id).then(async (data) => {
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
</script>

<style scoped>
.character-hub {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hub-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px 20px;
  background-color: var(--color-panel-header);
  border: 1px solid var(--color-border-dark);
  border-radius: 8px;
}

@media (min-width: 720px) {
  .hub-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.hub-header__text {
  max-width: 60ch;
}

.hub-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.hub-description {
  margin: 6px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
}

.account-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  color: var(--color-text-normal);
}

.hub-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.hub-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hub-list__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.hub-list__title {
  margin: 0;
  font-size: 18px;
}

.hub-list__count {
  color: var(--color-text-muted);
  font-size: 13px;
}

.hub-empty {
  margin: 0;
  padding: 16px;
  border: 1px dashed var(--color-border-normal);
  border-radius: 8px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.character-hub--list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.character-hub--item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-normal);
  border-radius: 10px;
  background-color: var(--color-panel-body);
}

.character-hub--item--highlighted {
  box-shadow:
    inset 0 0 0 1px var(--color-accent),
    0 0 6px var(--color-accent);
}

.character-hub--item-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 640px) {
  .character-hub--item-main {
    flex-direction: row;
    align-items: baseline;
  }
}

.character-hub--name {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  padding: 0;
  text-align: left;
  overflow-wrap: break-word;
  word-break: break-all;
}

.character-hub--date {
  color: var(--color-text-muted);
  font-size: 13px;
}

.character-hub--actions-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.character-hub--actions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.character-hub--confirmation-message {
  margin: 0;
  margin-right: 16px;
  color: var(--color-text-muted);
}

.button-compact {
  padding: 6px 10px;
  font-size: 0.9em;
  border-radius: 4px;
  font-weight: 500;
  height: auto;
  width: auto;
}

.button-compact:hover {
  border-color: var(--color-accent-middle);
  color: var(--color-accent-light);
  background-color: transparent;
  box-shadow: none;
  text-shadow: none;
}

.auth-section {
  padding: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.login-button {
  padding: 10px 20px;
  font-size: 16px;
}

.logout-button {
  font-size: 12px;
}
</style>
