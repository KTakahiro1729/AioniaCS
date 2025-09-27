<template>
  <div class="character-hub">
    <div v-if="!isAuthenticated" class="hub-card hub-card--center">
      <h2 class="hub-title">{{ uiTexts.title }}</h2>
      <p class="hub-lead">{{ uiTexts.unauthenticated.description }}</p>
      <button class="button-base hub-button hub-button--accent" type="button" @click="handleLogin">
        <span aria-hidden="true" class="hub-button__icon">★</span>
        {{ uiTexts.unauthenticated.button }}
      </button>
      <p class="hub-note">{{ uiTexts.unauthenticated.footer }}</p>
    </div>

    <div v-else class="hub-shell">
      <header class="hub-header">
        <div class="hub-header__texts">
          <h2 class="hub-title">{{ uiTexts.title }}</h2>
          <p class="hub-subtitle">{{ uiTexts.subtitle }}</p>
        </div>
        <div class="hub-account">
          <span class="hub-account__name">{{ userName }}</span>
          <button class="button-base button-compact hub-account__logout" type="button" @click="handleLogout">
            {{ uiTexts.actions.signOut }}
          </button>
        </div>
      </header>

      <section class="hub-primary" aria-live="polite">
        <p class="hub-primary__message">{{ primaryMessage }}</p>
        <button
          class="button-base hub-button hub-button--accent"
          type="button"
          :disabled="isPrimaryDisabled"
          @click="handlePrimaryAction"
        >
          <span aria-hidden="true" class="hub-button__icon">★</span>
          {{ primaryActionLabel }}
        </button>
      </section>

      <section class="hub-list" aria-label="クラウドの記録">
        <header class="hub-list__header">
          <h3 class="hub-list__title">{{ uiTexts.list.title }}</h3>
          <button class="button-base button-compact" type="button" @click="refreshList" :disabled="isListLoading">
            {{ uiTexts.list.refresh }}
          </button>
        </header>

        <div v-if="listError" class="hub-state hub-state--error">
          <span class="hub-state__text">{{ uiTexts.errors.load }}</span>
          <button class="button-base button-compact" type="button" @click="refreshList">
            {{ uiTexts.errors.retry }}
          </button>
        </div>

        <div v-else-if="isListLoading && !hasLoadedOnce" class="hub-state hub-state--loading">
          <span class="hub-state__text">{{ uiTexts.loading.message }}</span>
        </div>

        <div v-else-if="characters.length === 0" class="hub-state hub-state--empty">
          <span class="hub-state__text">{{ uiTexts.list.empty }}</span>
        </div>

        <div v-else class="hub-list__body">
          <ul class="record-list">
            <li
              v-for="ch in characters"
              :key="ch.id"
              :class="['record-item', { 'record-item--active': ch.id === uiStore.currentCloudFileId }]"
            >
              <div class="record-item__top">
                <div class="record-item__info">
                  <span class="record-item__name">{{ ch.characterName || uiTexts.list.unnamed }}</span>
                  <span class="record-item__meta">
                    {{ ch.id === uiStore.currentCloudFileId ? uiTexts.list.editing : formatDate(ch.updatedAt) }}
                  </span>
                </div>
                <button class="button-base button-compact record-item__load" type="button" @click="confirmLoad(ch)">
                  {{ uiTexts.actions.load }}
                </button>
              </div>

              <div v-if="characterToDelete && characterToDelete.id === ch.id" class="record-item__confirm">
                <p class="record-item__confirm-text">{{ uiTexts.confirmDelete.message }}</p>
                <div class="record-item__confirm-actions">
                  <button class="button-base button-compact" type="button" @click="executeDelete">
                    {{ uiTexts.confirmDelete.confirm }}
                  </button>
                  <button class="button-base button-compact button-secondary" type="button" @click="cancelDelete">
                    {{ uiTexts.confirmDelete.cancel }}
                  </button>
                </div>
              </div>

              <div v-else class="record-item__actions" aria-label="記録に対する操作">
                <button class="button-base button-compact" type="button" @click="overwrite(ch)">
                  {{ uiTexts.actions.update }}
                </button>
                <button class="button-base button-compact" type="button" @click="exportLocal(ch)">
                  {{ uiTexts.actions.export }}
                </button>
                <button class="button-base button-compact button-secondary" type="button" @click="startDelete(ch)">
                  {{ uiTexts.actions.delete }}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="showListOverlay" class="hub-list__overlay" aria-live="polite" aria-busy="true">
          <span class="hub-state__text">{{ uiTexts.loading.message }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
  saveToCloud: Function,
});

const characterToDelete = ref(null);
const isListLoading = ref(false);
const hasLoadedOnce = ref(false);
const listError = ref(null);

const uiStore = useUiStore();
const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();

const uiTexts = messages.characterHub.ui;

const characters = computed(() =>
  [...uiStore.cloudCharacters].sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  }),
);

const userName = computed(() => user.value?.name || uiTexts.actions.unknownUser);
const hasRecords = computed(() => characters.value.length > 0);
const isCurrentRecorded = computed(() =>
  !!uiStore.currentCloudFileId && characters.value.some((c) => c.id === uiStore.currentCloudFileId),
);
const showListOverlay = computed(() => isListLoading.value && hasLoadedOnce.value && !listError.value);

const primaryState = computed(() => {
  if (isListLoading.value) {
    return 'loading';
  }
  if (!hasRecords.value) {
    return 'unsaved';
  }
  return isCurrentRecorded.value ? 'recorded' : 'unsaved';
});

const primaryMessage = computed(() => {
  if (primaryState.value === 'recorded') {
    return uiTexts.primary.savedMessage;
  }
  if (primaryState.value === 'loading') {
    return uiTexts.loading.message;
  }
  return uiTexts.primary.unsavedMessage;
});

const primaryActionLabel = computed(() => {
  if (primaryState.value === 'recorded') {
    return uiTexts.primary.updateAction;
  }
  if (primaryState.value === 'loading') {
    return uiTexts.loading.button;
  }
  return uiTexts.primary.recordAction;
});

const isPrimaryDisabled = computed(() => primaryState.value === 'loading');

onMounted(() => {
  if (isAuthenticated.value) {
    ensureCharacters();
  }
});

watch(
  () => isAuthenticated.value,
  (signedIn) => {
    if (signedIn) {
      ensureCharacters();
    } else {
      resetListState();
    }
  },
);

async function ensureCharacters() {
  if (!props.dataManager) return;
  await refreshList();
}

function resetListState() {
  characterToDelete.value = null;
  isListLoading.value = false;
  hasLoadedOnce.value = false;
  listError.value = null;
}

async function refreshList() {
  if (!props.dataManager) return;
  isListLoading.value = true;
  listError.value = null;
  try {
    await uiStore.refreshCloudCharacters(props.dataManager);
  } catch (error) {
    console.error('Failed to refresh characters:', error);
    listError.value = error;
    showToast({ type: 'error', ...messages.characterHub.listError() });
  } finally {
    isListLoading.value = false;
    hasLoadedOnce.value = true;
  }
}

async function saveNew() {
  if (!props.saveToCloud) return;
  listError.value = null;
  isListLoading.value = true;
  try {
    await props.saveToCloud(null);
  } finally {
    isListLoading.value = false;
    hasLoadedOnce.value = true;
  }
}

async function overwrite(ch) {
  if (!props.saveToCloud) return;
  listError.value = null;
  isListLoading.value = true;
  try {
    await props.saveToCloud(ch.id);
  } finally {
    isListLoading.value = false;
    hasLoadedOnce.value = true;
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
    uiStore.cancelPendingCloudSave(ch.id);
    uiStore.removeCloudCharacter(ch.id);
    showToast({ type: 'success', ...messages.characterHub.delete.successToast() });
  } else {
    const previous = [...uiStore.cloudCharacters];
    uiStore.removeCloudCharacter(ch.id);
    const deletePromise = props.dataManager.deleteCloudCharacter(ch.id).catch((err) => {
      uiStore.cloudCharacters = previous;
      throw err;
    });
    showAsyncToast(deletePromise, {
      loading: messages.characterHub.delete.asyncToast.loading(),
      success: messages.characterHub.delete.asyncToast.success(),
      error: (err) => messages.characterHub.delete.asyncToast.error(err),
    });
    try {
      await deletePromise;
    } finally {
      await refreshList();
    }
  }

  characterToDelete.value = null;
}

async function exportLocal(ch) {
  const exportPromise = props.dataManager.loadCloudCharacter(ch.id).then(async (data) => {
    if (data) {
      await props.dataManager.saveData(
        data.character,
        data.skills,
        data.specialSkills,
        data.equipments,
        data.histories,
      );
    }
  });
  showAsyncToast(exportPromise, {
    loading: messages.characterHub.export.loading(),
    success: messages.characterHub.export.success(),
    error: (err) => messages.characterHub.export.error(err),
  });
}

async function handlePrimaryAction() {
  if (isPrimaryDisabled.value) return;
  if (primaryState.value === 'recorded') {
    await saveOrUpdateCurrentCharacter();
  } else {
    await saveNew();
  }
}

async function saveOrUpdateCurrentCharacter() {
  if (!props.saveToCloud) return;
  listError.value = null;
  isListLoading.value = true;
  try {
    await props.saveToCloud(uiStore.currentCloudFileId);
  } finally {
    isListLoading.value = false;
    hasLoadedOnce.value = true;
  }
}
</script>

<style scoped>
.character-hub {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hub-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 32px 24px;
  border-radius: 16px;
  border: 1px solid var(--color-border-dark);
  background: linear-gradient(145deg, rgba(20, 22, 30, 0.95), rgba(12, 13, 18, 0.9));
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  text-align: center;
}

.hub-card--center {
  justify-content: center;
}

.hub-title {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.08em;
}

.hub-lead {
  margin: 0;
  max-width: 48ch;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.hub-note {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.hub-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.hub-button--accent {
  padding: 10px 22px;
  font-size: 16px;
}

.hub-button__icon {
  font-size: 18px;
}

.hub-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 16px;
  border: 1px solid var(--color-border-dark);
  background: linear-gradient(160deg, rgba(26, 28, 38, 0.95), rgba(14, 15, 20, 0.92));
}

@media (min-width: 720px) {
  .hub-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.hub-header__texts {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 60ch;
}

.hub-subtitle {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.hub-account {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  text-align: right;
}

.hub-account__name {
  font-size: 14px;
  color: var(--color-text-muted);
}

.hub-account__logout {
  align-self: flex-end;
}

.hub-primary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--color-border-normal);
  background: rgba(18, 19, 26, 0.85);
}

.hub-primary__message {
  margin: 0;
  line-height: 1.7;
}

.hub-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--color-border-normal);
  background: rgba(16, 17, 24, 0.88);
}

.hub-list__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.hub-list__title {
  margin: 0;
  font-size: 18px;
}

.hub-list__body {
  position: relative;
}

.record-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}

.record-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--color-border-dark);
  background: rgba(22, 24, 32, 0.92);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.record-item--active {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 2px rgba(239, 176, 84, 0.6), 0 0 12px rgba(239, 176, 84, 0.35);
  background: rgba(34, 25, 10, 0.45);
}

.record-item__top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 640px) {
  .record-item__top {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.record-item__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 60ch;
}

.record-item__name {
  font-size: 18px;
  font-weight: 700;
  word-break: break-word;
}

.record-item__meta {
  font-size: 13px;
  color: var(--color-text-muted);
}

.record-item__load {
  align-self: flex-start;
}

.record-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.record-item__confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.record-item__confirm-text {
  margin: 0;
  color: var(--color-text-muted);
}

.record-item__confirm-actions {
  display: flex;
  gap: 10px;
}

.hub-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 12px;
  border: 1px dashed var(--color-border-normal);
  background: rgba(18, 19, 26, 0.6);
  text-align: center;
}

.hub-state__text {
  margin: 0;
  line-height: 1.6;
}

.hub-state--error {
  border-color: var(--color-status-experience-over-border);
}

.hub-list__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(10, 11, 16, 0.82);
}
</style>
