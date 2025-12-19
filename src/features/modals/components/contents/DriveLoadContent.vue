<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { messages } from '@/i18n/index.js';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';
import { copyText } from '@/shared/utils/clipboard.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
import { useModalStore } from '@/features/modals/stores/modalStore.js';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';

const sentinelRef = ref(null);
const observer = ref(null);

const {
  displayedItems,
  isLoadingCache,
  isSyncing,
  isFetchingMore,
  errorMessage,
  initialize,
  revealMore,
  refresh,
  cleanup,
  selectCharacter,
  syncItemMetadata,
} = useDriveLoadPageState();

const { showAsyncToast, logAndToastError } = useNotifications();
const modalStore = useModalStore();

let driveManager = null;
try {
  driveManager = getGoogleDriveManagerInstance();
} catch (error) {
  logAndToastError(error, { title: messages.driveLoadPage.title, message: messages.driveLoadPage.errors.missingDriveManager });
}

const { enableShare, disableShare } = useShare({ googleDriveManager: driveManager });

const filteredItems = computed(() =>
  displayedItems.value.filter((item) => typeof item?.fileName === 'string' && item.fileName.toLowerCase().endsWith('.zip')),
);
const isEmpty = computed(() => !isLoadingCache.value && filteredItems.value.length === 0);
const isBusy = computed(() => isSyncing.value || isFetchingMore.value);

function formatTimestamp(seconds) {
  if (!seconds) return messages.driveLoadPage.labels.unknownDate;
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return messages.driveLoadPage.labels.unknownDate;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function setupObserver() {
  if (!sentinelRef.value) return;
  if (observer.value) {
    observer.value.disconnect();
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealMore();
          break;
        }
      }
    },
    { rootMargin: '0px 0px 180px 0px', threshold: 0.1 },
  );

  observer.value.observe(sentinelRef.value);
}

function getCharacterName(item) {
  const name = item?.characterName || '';
  if (name.trim()) {
    return name.trim();
  }
  if (item?.fileName) {
    const base = item.fileName.replace(/\.zip$/i, '').trim();
    if (base) {
      return base;
    }
  }
  return messages.driveLoadPage.labels.untitled;
}

function getDownloadName(item) {
  if (!item?.fileName) return `${messages.driveLoadPage.labels.untitled}.zip`;
  return item.fileName.toLowerCase().endsWith('.zip') ? item.fileName : `${item.fileName}.zip`;
}

function getThumbnailUrl(item) {
  const link = item?.thumbnailLink;
  if (!link) return null;
  if (/([?&]sz=)/.test(link)) {
    return link;
  }
  const separator = link.includes('?') ? '&' : '?';
  return `${link}${separator}sz=w256`;
}

function requireDriveManager() {
  if (!driveManager) {
    throw new Error(messages.driveLoadPage.errors.missingDriveManager);
  }
  return driveManager;
}

async function handleLoad(item) {
  if (!item?.id) return;
  let prefetchedData = null;
  if (item.outOfSync) {
    const result = await syncItemMetadata(item.id);
    prefetchedData = result?.payload || null;
  }
  selectCharacter(item.id, prefetchedData);
  modalStore.hideModal();
}

async function handleDelete(item) {
  if (!item?.id) return;
  const confirmed = window.confirm(messages.driveLoadPage.confirmations.delete(getCharacterName(item)));
  if (!confirmed) return;
  const manager = requireDriveManager();
  try {
    await showAsyncToast(manager.deleteCharacterFile(item.id), messages.driveLoadPage.toasts.delete, 'drive-delete');
    await refresh();
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.delete.error, 'drive-delete');
  }
}

async function handleShare(item) {
  if (!item?.id) return;
  const task = (async () => {
    const link = await enableShare(item.id);
    if (!link) {
      throw new Error(messages.share.errors.shareFailed);
    }
    await copyText(link);
    return link;
  })();

  try {
    await showAsyncToast(task, messages.driveLoadPage.toasts.share, 'drive-share');
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.share.error, 'drive-share');
  }
}

async function handleUnshare(item) {
  if (!item?.id || !item.shared) return;
  const confirmed = window.confirm(messages.driveLoadPage.confirmations.unshare(getCharacterName(item)));
  if (!confirmed) return;
  try {
    await showAsyncToast(disableShare(item.id), messages.driveLoadPage.toasts.unshare, 'drive-unshare');
    await refresh();
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.unshare.error, 'drive-unshare');
  }
}

async function handleDownload(item) {
  if (!item?.id) return;
  const manager = requireDriveManager();
  const task = (async () => {
    const content = await manager.loadFileContent(item.id);
    if (!content) {
      throw new Error(messages.driveLoadPage.toasts.download.error.message);
    }
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getDownloadName(item);
    link.click();
    URL.revokeObjectURL(url);
    return url;
  })();

  try {
    await showAsyncToast(task, messages.driveLoadPage.toasts.download, 'drive-download');
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.download.error, 'drive-download');
  }
}

onMounted(() => {
  initialize();
  setupObserver();
});

onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
  cleanup();
});
</script>

<template>
  <div class="drive-load" :aria-busy="isBusy">
    <header class="drive-load__header">
      <div class="drive-load__title-group">
        <div
          class="drive-load__status-indicator"
          :data-state="errorMessage ? 'error' : isSyncing ? 'sync' : 'idle'"
          aria-hidden="true"
        />
        <h1 class="drive-load__title">{{ messages.driveLoadPage.title }}</h1>
      </div>
      <button class="button-base drive-load__refresh" type="button" :disabled="isBusy" @click="refresh">
        {{ messages.driveLoadPage.buttons.refresh }}
      </button>
    </header>
    <p v-if="isEmpty" class="drive-load__placeholder">{{ messages.driveLoadPage.placeholder }}</p>

    <div v-else class="drive-load__list" role="list">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="drive-row"
        role="listitem"
        data-test="drive-row"
        :title="item.fileName || messages.driveLoadPage.labels.untitled"
      >
        <div class="drive-row__layout">
          <div v-if="getThumbnailUrl(item)" class="drive-row__thumb">
            <img :src="getThumbnailUrl(item)" loading="lazy" decoding="async" :alt="getCharacterName(item)" />
          </div>
          <div v-else-if="item.hasThumbnail" class="drive-row__thumb drive-row__thumb--placeholder" aria-hidden="true" />

          <div class="drive-row__content">
            <div class="drive-row__main">
              <div class="drive-row__heading">
                <h2 class="drive-row__title" data-test="drive-row-title">{{ getCharacterName(item) }}</h2>
                <div class="drive-row__badges">
                  <span
                    v-if="item.outOfSync"
                    class="drive-row__indicator drive-row__indicator--warning"
                    role="img"
                    :title="messages.driveLoadPage.labels.hashWarning"
                    :aria-label="messages.driveLoadPage.labels.hashWarning"
                    data-test="drive-row-warning"
                  >
                    ▲
                  </span>
                  <span v-if="item.shared" class="drive-row__badge drive-row__badge--muted" role="status">
                    {{ messages.driveLoadPage.labels.shared }}
                  </span>
                </div>
              </div>
            </div>
            <div class="drive-row__meta">
              <dl class="drive-row__meta-grid">
                <div class="drive-row__meta-item" data-test="drive-row-field">
                  <dt>{{ messages.driveLoadPage.labels.created }}</dt>
                  <dd>{{ formatTimestamp(item.createdAt) }}</dd>
                </div>
                <div class="drive-row__meta-item" data-test="drive-row-field">
                  <dt>{{ messages.driveLoadPage.labels.modified }}</dt>
                  <dd>{{ formatTimestamp(item.lastModifiedAtDrive) }}</dd>
                </div>
              </dl>
              <div class="drive-row__actions">
                <button
                  class="button-base button-base--primary"
                  type="button"
                  :aria-label="messages.driveLoadPage.actions.loadAria(getCharacterName(item))"
                  data-test="drive-row-load"
                  @click="handleLoad(item)"
                >
                  {{ messages.driveLoadPage.actions.load }}
                </button>
                <button
                  class="button-base button-base--danger"
                  type="button"
                  :aria-label="messages.driveLoadPage.actions.deleteAria(getCharacterName(item))"
                  data-test="drive-row-delete"
                  @click="handleDelete(item)"
                >
                  {{ messages.driveLoadPage.actions.delete }}
                </button>
                <button
                  class="button-base button-base--ghost"
                  type="button"
                  :aria-label="messages.driveLoadPage.actions.shareAria(getCharacterName(item))"
                  data-test="drive-row-share"
                  @click="handleShare(item)"
                >
                  {{ messages.driveLoadPage.actions.share }}
                </button>
                <button
                  class="button-base button-base--ghost drive-row__unshare"
                  type="button"
                  :disabled="!item.shared"
                  :aria-label="messages.driveLoadPage.actions.unshareAria(getCharacterName(item))"
                  data-test="drive-row-unshare"
                  @click="handleUnshare(item)"
                >
                  {{ item.shared ? messages.driveLoadPage.actions.unshare : messages.driveLoadPage.actions.unshareDisabled }}
                </button>
                <button
                  class="button-base button-base--ghost"
                  type="button"
                  :aria-label="messages.driveLoadPage.actions.downloadAria(getDownloadName(item))"
                  data-test="drive-row-download"
                  @click="handleDownload(item)"
                >
                  {{ messages.driveLoadPage.actions.download }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div ref="sentinelRef" class="drive-load__sentinel" aria-hidden="true">
      <span v-if="isSyncing">{{ messages.driveLoadPage.status.syncing }}</span>
      <span v-else-if="isFetchingMore">{{ messages.driveLoadPage.status.loadMore }}</span>
    </div>
  </div>
</template>

<style scoped>
.drive-load {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 8px 12px;
}

.drive-load__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 4px 0;
  flex-wrap: wrap;
}

.drive-load__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.drive-load__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-primary);
}

.drive-load__status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border-muted, #3a3a4a);
}

.drive-load__status-indicator[data-state='sync'] {
  background: #4da3ff;
  box-shadow: 0 0 0 6px rgba(77, 163, 255, 0.15);
}

.drive-load__status-indicator[data-state='error'] {
  background: #ff6b6b;
  box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.15);
}

.drive-load__refresh {
  min-width: 120px;
  align-self: flex-start;
}

.drive-load__placeholder {
  margin: 0;
  color: var(--color-text-muted);
}

.drive-load__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drive-row {
  border: 1px solid var(--color-border-muted, #3a3a4a);
  border-radius: 10px;
  padding: 14px;
  background: linear-gradient(145deg, rgba(39, 39, 52, 0.9), rgba(26, 26, 36, 0.9));
}

.drive-row__layout {
  display: grid;
  grid-template-columns: minmax(128px, 160px) 1fr;
  gap: 12px;
  align-items: stretch;
}

@media (max-width: 900px) {
  .drive-row__layout {
    grid-template-columns: 1fr;
  }

  .drive-row__thumb {
    justify-self: center;
  }
}

.drive-row__thumb {
  width: 128px;
  height: 128px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-muted, #3a3a4a);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.35));
  justify-self: start;
}

.drive-row__thumb img {
  width: 128px;
  height: 128px;
  object-fit: contain;
  display: block;
}

.drive-row__thumb--placeholder {
  display: block;
  background: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 10px, rgba(0, 0, 0, 0.15) 10px, rgba(0, 0, 0, 0.15) 20px);
}

.drive-row__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drive-row__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drive-row__heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.drive-row__title {
  margin: 0;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 0.3px;
}

.drive-row__badges {
  display: flex;
  gap: 6px;
  align-items: center;
}

.drive-row__indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 200, 70, 0.55);
  background: radial-gradient(circle at 30% 30%, rgba(255, 220, 120, 0.18), rgba(40, 30, 10, 0.85));
  color: #f6d76b;
  font-weight: 800;
  font-size: 0.85rem;
  box-shadow: 0 0 12px rgba(255, 200, 70, 0.15);
}

.drive-row__indicator--warning {
  background: radial-gradient(circle at 30% 30%, rgba(255, 220, 120, 0.2), rgba(60, 45, 20, 0.9));
}

.drive-row__badge {
  background: #ffb347;
  color: #1a1a24;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.drive-row__badge--muted {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
  border-color: var(--color-border-muted, #3a3a4a);
}

.drive-row__meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.drive-row__meta-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 8px 12px;
}

.drive-row__meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drive-row__meta-item dt {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.drive-row__meta-item dd {
  margin: 0;
  text-align: right;
  color: var(--color-text-primary);
  font-weight: 700;
}

.drive-row__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.drive-row__unshare:disabled {
  opacity: 0.5;
}

.drive-load__sentinel {
  min-height: 16px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 4px;
}
</style>
