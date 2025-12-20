<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { messages } from '@/i18n/index.js';
import { useDriveLoadPageState } from '@/features/cloud-sync/composables/useDriveLoadPageState.js';
import { copyText } from '@/shared/utils/clipboard.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { getDriveManagerInstance } from '@/infrastructure/google-drive/index.js';
import { useModalStore } from '@/features/modals/stores/modalStore.js';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';
import { formatRelativeDateTime } from '@/shared/utils/utils.js';

const sentinelRef = ref(null);
const observer = ref(null);

const { displayedItems, isLoadingCache, isSyncing, isFetchingMore, initialize, revealMore, refresh, cleanup, selectCharacter } =
  useDriveLoadPageState();

const { showAsyncToast, logAndToastError } = useNotifications();
const modalStore = useModalStore();
const props = defineProps({
  loadCharacterFromDrive: {
    type: Function,
    default: null,
  },
});

let driveManager = null;
try {
  driveManager = getDriveManagerInstance();
} catch (error) {
  logAndToastError(error, { title: messages.driveLoadPage.title, message: messages.driveLoadPage.errors.missingDriveManager });
}

const { enableShare, disableShare } = useShare({ googleDriveManager: driveManager });
const deletingItemId = ref(null);
const processingItemId = ref(null);
const unshareLabel = messages.driveLoadPage.actions.unshareShort ?? '解除';
const unshareDisabledLabel =
  messages.driveLoadPage.actions.unshareDisabledShort ?? messages.driveLoadPage.actions.unshareDisabled ?? messages.driveLoadPage.actions.unshare;
const cancelLabel =
  messages.ui?.confirmations?.unsavedChanges?.buttons?.find?.((button) => button.value === 'cancel')?.label || 'キャンセル';

const filteredItems = computed(() =>
  displayedItems.value.filter((item) => typeof item?.fileName === 'string' && item.fileName.toLowerCase().endsWith('.zip')),
);
const hasItems = computed(() => filteredItems.value.length > 0);
const isLoadingEmpty = computed(() => (isLoadingCache.value || isSyncing.value) && !hasItems.value);
const isEmpty = computed(() => !isLoadingEmpty.value && !hasItems.value);
const isBusy = computed(() => isSyncing.value || isFetchingMore.value || isLoadingCache.value);
const loadingLabel = computed(() => messages.driveLoadPage.status.loadingCache || '読み込み中……');
const emptyLabel = computed(
  () => messages.driveLoadPage.emptyMessage || messages.driveLoadPage.placeholder || '保存済みのキャラクターシートはありません',
);

function formatTimestamp(seconds) {
  const formatted = formatRelativeDateTime(seconds);
  if (!formatted) {
    return messages.driveLoadPage.labels.unknownDate;
  }
  return formatted;
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
  cancelDelete();
  const displayName = getCharacterName(item);
  if (typeof props.loadCharacterFromDrive === 'function') {
    const loaded = await props.loadCharacterFromDrive(item.id, null, displayName);
    if (!loaded) return;
  } else {
    selectCharacter(item.id, null);
  }
  modalStore.hideModal();
}

function requestDelete(item) {
  if (!item?.id) return;
  deletingItemId.value = item.id;
}

function cancelDelete() {
  deletingItemId.value = null;
}

async function confirmDelete(item) {
  if (!item?.id) return;
  const manager = requireDriveManager();
  deletingItemId.value = item.id;
  try {
    await showAsyncToast(manager.deleteCharacterFile(item.id), messages.driveLoadPage.toasts.delete, 'drive-delete');
    await refresh();
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.delete.error, 'drive-delete');
  } finally {
    cancelDelete();
  }
}

async function handleShare(item) {
  if (!item?.id) return;
  cancelDelete();
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
  cancelDelete();
  if (processingItemId.value) return;
  processingItemId.value = item.id;
  try {
    await showAsyncToast(disableShare(item.id), messages.driveLoadPage.toasts.unshare, 'drive-unshare');
    await refresh();
  } catch (error) {
    logAndToastError(error, messages.driveLoadPage.toasts.unshare.error, 'drive-unshare');
  } finally {
    processingItemId.value = null;
  }
}

async function handleDownload(item) {
  if (!item?.id) return;
  cancelDelete();
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
    <Teleport v-if="modalStore.isVisible" to="[data-slot='header-actions']">
      <button class="button-base drive-load__refresh" type="button" :disabled="isBusy" @click="refresh">
        {{ messages.driveLoadPage.buttons.refresh }}
      </button>
    </Teleport>
    <div v-if="isLoadingEmpty" class="drive-load__state drive-load__state--loading">
      <p class="drive-load__state-text">{{ loadingLabel }}</p>
    </div>
    <div v-else-if="isEmpty" class="drive-load__state drive-load__state--empty">
      <p class="drive-load__state-text">{{ emptyLabel }}</p>
    </div>

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
              <div class="drive-row__title-row">
                <h2 class="drive-row__title" data-test="drive-row-title">{{ getCharacterName(item) }}</h2>
                <div class="drive-row__badges">
                  <span
                    v-if="item.shared"
                    class="drive-row__badge drive-row__badge--muted"
                    role="status"
                    :aria-label="messages.driveLoadPage.labels.sharedAria"
                  >
                    {{ messages.driveLoadPage.labels.shared }}
                  </span>
                  <div class="drive-row__dates">
                    <span data-test="drive-row-field">
                      {{ messages.driveLoadPage.labels.created }}: {{ formatTimestamp(item.createdAt) }}
                    </span>
                    <span data-test="drive-row-field">
                      {{ messages.driveLoadPage.labels.modified }}: {{ formatTimestamp(item.lastModifiedAtDrive) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="drive-row__actions">
                <div
                  v-if="deletingItemId === item.id"
                  class="drive-row__delete-confirm"
                  role="status"
                  aria-live="polite"
                  :aria-label="messages.driveLoadPage.confirmations.delete(getCharacterName(item))"
                >
                  <p class="drive-row__confirm-message">{{ messages.driveLoadPage.confirmations.delete(getCharacterName(item)) }}</p>
                  <div class="drive-row__confirm-actions">
                    <button
                      class="button-base button-base--delete is-joined-right"
                      type="button"
                      :aria-label="messages.driveLoadPage.actions.deleteAria(getCharacterName(item))"
                      data-test="drive-row-delete"
                      @click="confirmDelete(item)"
                    >
                      {{ messages.driveLoadPage.actions.delete }}
                    </button>
                    <button
                      class="button-base button-base--ghost is-joined-left"
                      type="button"
                      :aria-label="cancelLabel"
                      @click="cancelDelete"
                    >
                      {{ cancelLabel }}
                    </button>
                  </div>
                </div>
                <template v-else>
                  <div
                    class="drive-row__action-cluster drive-row__action-cluster--data"
                    :aria-label="messages.driveLoadPage.labels.selectAction"
                  >
                    <button
                      class="button-base button-base--primary is-joined-right"
                      type="button"
                      :aria-label="messages.driveLoadPage.actions.loadAria(getCharacterName(item))"
                      data-test="drive-row-load"
                      @click="handleLoad(item)"
                    >
                      {{ messages.driveLoadPage.actions.load }}
                    </button>
                    <button
                      class="button-base button-base--ghost is-joined-left"
                      type="button"
                      :aria-label="messages.driveLoadPage.actions.downloadAria(getDownloadName(item))"
                      data-test="drive-row-download"
                      @click="handleDownload(item)"
                    >
                      {{ messages.driveLoadPage.actions.download }}
                    </button>
                  </div>
                  <div class="drive-row__action-cluster drive-row__action-cluster--share">
                    <button
                      class="button-base button-base--ghost is-joined-right"
                      type="button"
                      :aria-label="messages.driveLoadPage.actions.shareAria(getCharacterName(item))"
                      data-test="drive-row-share"
                      @click="handleShare(item)"
                    >
                      {{ messages.driveLoadPage.actions.share }}
                    </button>
                    <button
                      class="button-base button-base--ghost drive-row__unshare is-joined-left"
                      type="button"
                      :disabled="!item.shared || processingItemId === item.id"
                      :aria-label="messages.driveLoadPage.actions.unshareAria(getCharacterName(item))"
                      data-test="drive-row-unshare"
                      @click="handleUnshare(item)"
                    >
                      {{ item.shared ? unshareLabel : unshareDisabledLabel }}
                    </button>
                  </div>
                  <div class="drive-row__action-cluster drive-row__action-cluster--danger">
                    <button
                      class="button-base button-base--delete drive-row__delete"
                      type="button"
                      :aria-label="messages.driveLoadPage.actions.deleteAria(getCharacterName(item))"
                      data-test="drive-row-delete"
                      @click="requestDelete(item)"
                    >
                      {{ messages.driveLoadPage.actions.delete }}
                    </button>
                  </div>
                </template>
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
  padding: 8px 8px 12px;
}

.drive-load__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 4px 0;
}

.drive-load__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-text-primary);
}

.drive-load__refresh {
  align-self: flex-start;
}

.drive-load__state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 1px dashed var(--color-border-muted, #3a3a4a);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
}

.drive-load__state-text {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  text-align: center;
}

.drive-load__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drive-row {
  border: 1px solid var(--color-border-normal);
  border-radius: 10px;
  padding: 14px;
  background-color: var(--color-panel-body);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.drive-row__layout {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.drive-row__thumb {
  width: 100px;
  height: 100px;

  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-muted, #3a3a4a);
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.35));
  flex-shrink: 0;
}

.drive-row__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.drive-row__thumb--placeholder {
  display: block;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.05) 10px,
    rgba(0, 0, 0, 0.15) 10px,
    rgba(0, 0, 0, 0.15) 20px
  );
}

.drive-row__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  justify-content: space-around;
}

.drive-row__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drive-row__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drive-row__title {
  margin: 0;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: 0.3px;
  flex: 1;
  min-width: 0;
}

.drive-row__badges {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.drive-row__badge--muted {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.drive-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  justify-content: flex-end;
  align-items: stretch;
}

.drive-row__action-cluster {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 0;
  white-space: nowrap;
  align-items: stretch;
  flex-shrink: 0;
}

.drive-row__confirm-actions {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 0;
  white-space: nowrap;
  align-items: stretch;
}

.drive-row__action-cluster > .button-base,
.drive-row__confirm-actions > .button-base,
.drive-row__delete {
  height: 48px;
}

.drive-row__delete-confirm {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drive-row__confirm-message {
  margin: 0;
  color: var(--color-text-primary);
  font-weight: 700;
}

.drive-row__delete {
  flex-shrink: 0;
}

.drive-row__unshare:disabled {
  opacity: 0.5;
}

.drive-row__dates {
  display: flex;
  gap: 14px;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
}

.drive-load__sentinel {
  color: var(--color-text-muted);
  text-align: center;
}

@media (max-width: 720px) {
  .drive-row__layout {
    flex-direction: column;
    align-items: center;
  }

  .drive-row__content {
    width: 100%;
  }

  .drive-row__footer {
    justify-content: center;
  }
}
</style>
