<template>
  <div class="character-hub">
    <div v-if="!isAuthenticated" class="hub-unauth">
      <p class="hub-unauth__lead">{{ texts.signInLead }}</p>
    </div>

    <div v-else class="hub-shell">
      <section class="hub-list" :aria-label="labels.listTitle">
        <header class="hub-list__header">
          <h2 class="hub-list__title">{{ labels.listTitle }}</h2>
          <div class="hub-list__actions">
            <button class="button-base list-button" type="button" :disabled="isListLoading" @click="refreshList">
              <span class="icon-svg icon-svg-reload" aria-label="reload"></span>
            </button>
            <button class="button-base list-button list-button--add" type="button" :disabled="isListLoading" @click="handleSaveAction">
              +
            </button>
          </div>
        </header>

        <div class="hub-list__body" aria-live="polite">
          <div v-if="listError" class="hub-status hub-status--error">
            <p class="hub-status__message">{{ states.error }}</p>
            <button class="button-base button-compact" type="button" @click="refreshList">
              {{ actions.retry }}
            </button>
          </div>

          <div v-else-if="isListLoading && !hasLoadedOnce" class="hub-status hub-status--loading">
            <p class="hub-status__message">{{ states.loading }}</p>
          </div>

          <div v-else-if="characters.length === 0" class="hub-status hub-status--empty">
            <p class="hub-status__message">{{ states.empty }}</p>
          </div>

          <ul v-else class="record-list">
            <li v-for="ch in characters" :key="ch.id" :class="['record-item', { 'record-item--active': isActive(ch.id) }]">
              <div
                class="record-item__info"
                @click="confirmLoad(ch)"
                role="button"
                :aria-label="`${ch.characterName || labels.unnamed}を読み込む`"
              >
                <span class="record-item__name">{{ ch.characterName || labels.unnamed }}</span>
                <span class="record-item__meta">
                  {{ isActive(ch.id) ? states.editing : formatDate(ch.updatedAt) }}
                </span>
              </div>

              <div v-if="isPendingDelete(ch.id)" class="record-item__actions">
                <p class="record-item__confirm-message">{{ texts.confirmDelete }}</p>
                <button class="button-base button-compact hub-button-danger" type="button" @click="executeDelete">
                  {{ actions.delete }}
                </button>
                <button class="button-base button-compact" type="button" @click="cancelDelete">
                  {{ actions.cancel }}
                </button>
              </div>

              <div v-else class="record-item__actions">
                <button class="button-base button-compact" type="button" @click="overwrite(ch)">
                  {{ actions.overwrite }}
                </button>
                <button class="button-base button-compact" type="button" @click="exportLocal(ch)">
                  {{ actions.saveLocal }}
                </button>
                <button class="button-base button-compact button-secondary" type="button" @click="startDelete(ch)">
                  {{ actions.delete }}
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div v-if="showOverlay" class="hub-list__overlay" aria-live="polite" aria-busy="true">
          <p class="hub-status__message">{{ states.loading }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { useModal } from '../../composables/useModal.js';
import { messages } from '../../locales/ja.js';

const props = defineProps({
  dataManager: {
    type: Object,
    required: true,
  },
  loadCharacter: {
    type: Function,
    required: true,
  },
  saveToCloud: {
    type: Function,
    required: true,
  },
});

const { loginWithRedirect, isAuthenticated } = useAuth0();
const uiStore = useUiStore();
const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();

const texts = messages.characterHub.texts;
const actions = messages.characterHub.actions;
const labels = messages.characterHub.labels;
const states = messages.characterHub.states;
const notifications = messages.characterHub.notifications;
const modals = messages.characterHub.modals;

const characterToDelete = ref(null);
const isListLoading = ref(false);
const hasLoadedOnce = ref(false);
const listError = ref(null);

const characters = computed(() =>
  [...uiStore.cloudCharacters].sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  }),
);

const saveButtonLabel = computed(() => actions.saveNew);
const showOverlay = computed(() => isListLoading.value && hasLoadedOnce.value && !listError.value);

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
    showToast({ type: 'error', ...notifications.listError() });
  } finally {
    isListLoading.value = false;
    hasLoadedOnce.value = true;
  }
}

function isActive(id) {
  return uiStore.currentCloudFileId === id;
}

function isPendingDelete(id) {
  return characterToDelete.value?.id === id;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

async function handleSaveAction() {
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

async function confirmLoad(ch) {
  const result = await showModal(modals.loadConfirm(ch.characterName));
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
    showToast({ type: 'success', ...notifications.delete.success() });
  } else {
    const previous = [...uiStore.cloudCharacters];
    uiStore.removeCloudCharacter(ch.id);
    const deletePromise = props.dataManager.deleteCloudCharacter(ch.id).catch((err) => {
      uiStore.cloudCharacters = previous;
      throw err;
    });
    showAsyncToast(deletePromise, {
      loading: notifications.delete.async.loading(),
      success: notifications.delete.async.success(),
      error: (err) => notifications.delete.async.error(err),
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
      await props.dataManager.saveData(data.character, data.skills, data.specialSkills, data.equipments, data.histories);
    }
  });
  showAsyncToast(exportPromise, {
    loading: notifications.export.loading(),
    success: notifications.export.success(),
    error: (err) => notifications.export.error(err),
  });
}
</script>

<style scoped>
.character-hub {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.hub-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hub-unauth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  background: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 12px;
  text-align: center;
}

.hub-unauth__lead {
  margin: 0;
  line-height: 1.6;
}

.hub-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 12px;
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
  font-size: 1.1rem;
}

.hub-list__actions {
  display: flex;
  gap: 8px;
}

.hub-list__body {
  position: relative;
}

.hub-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-radius: 10px;
  border: 1px dashed var(--color-border-normal);
  background: var(--color-panel-sub-header);
  text-align: center;
}

.hub-status__message {
  margin: 0;
  line-height: 1.6;
}

.record-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
}

.record-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-header);
}

.record-item--active {
  border-color: var(--color-accent);
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.record-item__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* Prevents overflow */
  cursor: pointer;
}

.record-item__name {
  font-size: 1rem;
  font-weight: 700;
  word-break: break-word;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-item__meta {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.record-item__actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
}

.record-item__actions .button-compact {
  padding: 4px 8px;
  font-size: 0.8em;
}

.record-item__confirm-message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85em;
  white-space: nowrap;
  align-self: center;
}

.hub-button-danger {
  background: var(--color-delete-border);
  color: var(--color-text-normal);
}

.hub-list__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-background) 80%, transparent);
}

.list-button .icon-svg {
  width: 20px;
  height: 20px;
}
</style>
