<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { messages } from '@/i18n/index.js';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
import { copyText } from '@/shared/utils/clipboard.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';

const router = useRouter();
const sentinelRef = ref(null);
const observer = ref(null);

const {
  displayedItems,
  isLoadingCache,
  isSyncing,
  isFetchingMore,
  statusMessage,
  errorMessage,
  initialize,
  revealMore,
  refresh,
  cleanup,
  selectCharacter,
} = useDriveLoadPageState();

const { showAsyncToast, logAndToastError } = useNotifications();

let driveManager = null;
try {
  driveManager = getGoogleDriveManagerInstance();
} catch (error) {
  logAndToastError(error, { title: messages.driveLoadPage.title, message: messages.driveLoadPage.errors.missingDriveManager });
}

const filteredItems = computed(() =>
  displayedItems.value.filter((item) => typeof item?.fileName === 'string' && item.fileName.toLowerCase().endsWith('.zip')),
);
const isEmpty = computed(() => !isLoadingCache.value && filteredItems.value.length === 0);
const isBusy = computed(() => isSyncing.value || isFetchingMore.value);
const statusLabel = computed(() => statusMessage.value);
const statusDetail = computed(() => (errorMessage.value ? messages.driveLoadPage.status.retryHint : ''));

function goBackToSheet() {
  router.push({ name: 'character-sheet' });
}

function getDisplayName(item) {
  if (!item?.fileName) return messages.driveLoadPage.labels.untitled;
  const name = item.fileName.replace(/\.zip$/i, '');
  return name || messages.driveLoadPage.labels.untitled;
}

function getDownloadName(item) {
  if (!item?.fileName) return `${messages.driveLoadPage.labels.untitled}.zip`;
  return item.fileName.toLowerCase().endsWith('.zip') ? item.fileName : `${item.fileName}.zip`;
}

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

function requireDriveManager() {
  if (!driveManager) {
    throw new Error(messages.driveLoadPage.errors.missingDriveManager);
  }
  return driveManager;
}

function handleLoad(fileId) {
  if (!fileId) return;
  selectCharacter(fileId);
  router.push({ name: 'character-sheet' });
}

async function handleDelete(item) {
  if (!item?.id) return;
  const confirmed = window.confirm(messages.driveLoadPage.confirmations.delete(getDisplayName(item)));
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
  const manager = requireDriveManager();
  const task = (async () => {
    const link = await manager.ensureFilePublic(item.id);
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
  <div class="drive-load-page">
    <header class="drive-load-page__header">
      <button class="button-base drive-load-page__back" type="button" @click="goBackToSheet">
        {{ messages.driveLoadPage.buttons.back }}
      </button>
      <h1 class="drive-load-page__title">{{ messages.driveLoadPage.title }}</h1>
    </header>

    <section class="drive-load-page__content">
      <div class="drive-load-page__status" :data-busy="isBusy">
        <div class="drive-load-page__status-indicator" :data-state="errorMessage ? 'error' : isSyncing ? 'sync' : 'idle'" />
        <div class="drive-load-page__status-text">{{ statusLabel }}</div>
        <button class="button-base drive-load-page__refresh" type="button" :disabled="isBusy" @click="refresh">
          {{ messages.driveLoadPage.buttons.refresh }}
        </button>
      </div>
      <p v-if="statusDetail" class="drive-load-page__status-detail">{{ statusDetail }}</p>

      <p v-if="isEmpty" class="drive-load-page__placeholder">{{ messages.driveLoadPage.placeholder }}</p>

      <div v-else class="drive-load-page__list" role="list">
        <article
          v-for="item in filteredItems"
          :key="item.id"
          class="drive-card"
          role="listitem"
          data-test="drive-card"
        >
          <header class="drive-card__header">
            <div class="drive-card__title-block">
              <h2 class="drive-card__title" data-test="drive-card-title">{{ getDisplayName(item) }}</h2>
              <p class="drive-card__filename">{{ item.fileName || messages.driveLoadPage.labels.untitled }}</p>
            </div>
            <div class="drive-card__indicators">
              <span v-if="item.shared" class="drive-card__badge drive-card__badge--muted" role="status">
                {{ messages.driveLoadPage.labels.shared }}
              </span>
              <span v-if="item.outOfSync" class="drive-card__badge drive-card__badge--warning" role="status">
                {{ messages.driveLoadPage.labels.outOfSync }}
              </span>
            </div>
          </header>

          <dl class="drive-card__meta">
            <div class="drive-card__meta-row" data-test="drive-card-field">
              <dt>{{ messages.driveLoadPage.labels.created }}</dt>
              <dd>{{ formatTimestamp(item.createdAt) }}</dd>
            </div>
            <div class="drive-card__meta-row" data-test="drive-card-field">
              <dt>{{ messages.driveLoadPage.labels.modified }}</dt>
              <dd>{{ formatTimestamp(item.lastModifiedAtDrive) }}</dd>
            </div>
          </dl>

          <p v-if="item.outOfSync" class="drive-card__warning" data-test="drive-card-warning" role="status">
            {{ messages.driveLoadPage.labels.hashWarning }}
          </p>

          <div class="drive-card__actions">
            <button
              class="button-base button-base--primary"
              type="button"
              :aria-label="messages.driveLoadPage.actions.loadAria(getDisplayName(item))"
              data-test="drive-card-load"
              @click="handleLoad(item.id)"
            >
              {{ messages.driveLoadPage.actions.load }}
            </button>
            <button
              class="button-base button-base--ghost"
              type="button"
              :aria-label="messages.driveLoadPage.actions.shareAria(getDisplayName(item))"
              data-test="drive-card-share"
              @click="handleShare(item)"
            >
              {{ messages.driveLoadPage.actions.share }}
            </button>
            <button
              class="button-base button-base--ghost"
              type="button"
              :aria-label="messages.driveLoadPage.actions.downloadAria(getDownloadName(item))"
              data-test="drive-card-download"
              @click="handleDownload(item)"
            >
              {{ messages.driveLoadPage.actions.download }}
            </button>
            <button
              class="button-base button-base--danger"
              type="button"
              :aria-label="messages.driveLoadPage.actions.deleteAria(getDisplayName(item))"
              data-test="drive-card-delete"
              @click="handleDelete(item)"
            >
              {{ messages.driveLoadPage.actions.delete }}
            </button>
          </div>
        </article>
      </div>

      <div ref="sentinelRef" class="drive-load-page__sentinel" aria-hidden="true">
        <span v-if="isSyncing">{{ messages.driveLoadPage.status.syncing }}</span>
        <span v-else-if="isFetchingMore">{{ messages.driveLoadPage.status.loadMore }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.drive-load-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  color: var(--color-text-primary, #fff);
}

.drive-load-page__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drive-load-page__back {
  min-width: 120px;
}

.drive-load-page__title {
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
}

.drive-load-page__content {
  background: var(--color-panel, #1f1f2b);
  border: 1px solid var(--color-border-normal);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drive-load-page__status-detail {
  margin: 0 0 4px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.drive-load-page__status {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-muted, #3a3a4a);
  border-radius: 6px;
  background: var(--color-panel-body, #181824);
}

.drive-load-page__status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border-muted, #3a3a4a);
}

.drive-load-page__status-indicator[data-state='sync'] {
  background: #4da3ff;
  box-shadow: 0 0 0 6px rgba(77, 163, 255, 0.15);
}

.drive-load-page__status-indicator[data-state='error'] {
  background: #ff6b6b;
  box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.15);
}

.drive-load-page__status-text {
  color: var(--color-text-primary);
  font-weight: 600;
  min-height: 20px;
}

.drive-load-page__refresh {
  justify-self: end;
  min-width: 120px;
}

.drive-load-page__placeholder {
  margin: 0;
  color: var(--color-text-muted);
}

.drive-load-page__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.drive-card {
  border: 1px solid var(--color-border-muted, #3a3a4a);
  border-radius: 8px;
  padding: 14px;
  background: linear-gradient(145deg, rgba(39, 39, 52, 0.9), rgba(26, 26, 36, 0.9));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drive-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.drive-card__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drive-card__title {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
}

.drive-card__filename {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.drive-card__indicators {
  display: flex;
  gap: 6px;
  align-items: center;
}

.drive-card__badge {
  background: #ffb347;
  color: #1a1a24;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.drive-card__badge--warning {
  background: #ff6b6b;
  color: #1a1a24;
}

.drive-card__badge--muted {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
  border-color: var(--color-border-muted, #3a3a4a);
}

.drive-card__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drive-card__meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.drive-card__meta-row dt {
  color: var(--color-text-muted);
}

.drive-card__meta-row dd {
  margin: 0;
  text-align: right;
  color: var(--color-text-primary);
}

.drive-card__warning {
  margin: 4px 0 0;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 107, 107, 0.4);
  background: rgba(255, 107, 107, 0.08);
  color: #ffdede;
  font-size: 0.9rem;
}

.drive-card__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.drive-load-page__sentinel {
  min-height: 16px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 4px;
}
</style>
