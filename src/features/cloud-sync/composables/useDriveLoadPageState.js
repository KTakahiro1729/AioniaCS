import { computed, ref } from 'vue';
import { getDriveManagerInstance } from '@/infrastructure/google-drive/index.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/i18n/index.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const DISPLAY_BATCH = 10;
const PREFETCH_BUFFER = 10;
const INITIAL_PAGE_SIZE = 20;
const NEXT_PAGE_SIZE = 10;
const ZIP_MIME_TYPES = new Set(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/x-zip']);

function isZipEntry(raw) {
  const fileName = raw?.fileName || raw?.file_name || raw?.name || '';
  const mimeType = raw?.mimeType || raw?.mime_type;
  const hasZipExtension = typeof fileName === 'string' && fileName.toLowerCase().endsWith('.zip');
  if (hasZipExtension) return true;
  if (typeof mimeType === 'string') {
    const normalized = mimeType.toLowerCase();
    if (ZIP_MIME_TYPES.has(normalized) || normalized.includes('zip')) {
      return true;
    }
  }
  return false;
}

function toSeconds(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return Math.floor(date.getTime() / 1000);
}

export function normalizeMetadataItem(raw) {
  const id = raw?.fileId || raw?.file_id || raw?.id;
  if (!id) return null;
  if (!isZipEntry(raw)) return null;

  const fileName = raw?.fileName || raw?.file_name || raw?.name || '';
  const baseName = typeof fileName === 'string' ? fileName.replace(/\.zip$/i, '') : '';
  const characterName = baseName || raw?.characterName || raw?.character_name || '';
  const driveModifiedAt = toSeconds(raw?.modifiedTime);
  const createdAt = toSeconds(raw?.createdTime || raw?.created_time);
  const shared = raw?.shared == null ? null : Boolean(raw.shared);
  const hasThumbnail = raw?.hasThumbnail ?? raw?.has_thumbnail ?? null;
  const thumbnailLink = raw?.thumbnailLink || raw?.thumbnail_link || null;

  return {
    id,
    characterName,
    fileName,
    driveModifiedAt,
    cachedModifiedAt: null,
    lastModifiedAtDrive: driveModifiedAt,
    createdAt,
    syncedAt: null,
    shared,
    hasThumbnail: hasThumbnail == null ? null : Boolean(hasThumbnail),
    thumbnailLink,
  };
}

function sortItems(list) {
  return [...list].sort((a, b) => {
    const left = a.lastModifiedAtDrive || 0;
    const right = b.lastModifiedAtDrive || 0;
    if (left !== right) return right - left;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function stripInternal(entry) {
  if (!entry) return entry;
  const cleaned = { ...entry };
  delete cleaned.syncSource;
  delete cleaned.cachedOnly;
  return cleaned;
}

async function defaultRequestDrivePage(driveManager, { pageSize = INITIAL_PAGE_SIZE, pageToken = null, abortSignal = null } = {}) {
  if (!driveManager) {
    throw new Error(messages.driveLoadPage.errors.missingDriveManager);
  }

  const folderId = await driveManager.findOrCreateConfiguredCharacterFolder();
  if (!folderId) {
    throw new Error(messages.driveLoadPage.errors.folderUnavailable);
  }

  const gapiClient = typeof globalThis !== 'undefined' ? globalThis.gapi : undefined;

  if (!gapiClient?.client?.drive?.files?.list) {
    if (typeof driveManager.listFiles === 'function') {
      const files = await driveManager.listFiles(folderId);
      return { files, nextPageToken: null };
    }
    throw new Error(messages.driveLoadPage.errors.apiUnavailable);
  }

  await driveManager.ensureAccessToken();

  if (abortSignal?.aborted) {
    return { files: [], nextPageToken: null };
  }

  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and (mimeType='application/zip' or mimeType='application/x-zip-compressed' or mimeType='multipart/x-zip' or mimeType contains 'zip') and trashed=false`,
    fields: 'nextPageToken, files(id, name, createdTime, modifiedTime, shared, mimeType, hasThumbnail, thumbnailLink)',
    spaces: 'drive',
    pageSize,
    pageToken,
  });

  return { files: response.result.files || [], nextPageToken: response.result.nextPageToken || null };
}

export function useDriveLoadPageState(options = {}) {
  const driveManager = options.driveManager || getDriveManagerInstance();
  const requestDrivePage = options.requestDrivePage || ((params) => defaultRequestDrivePage(driveManager, params));
  const uiStore = useUiStore();
  const { logAndToastError } = useNotifications();

  const items = ref([]);
  const isLoadingCache = ref(false);
  const isSyncing = ref(false);
  const isFetchingMore = ref(false);
  const errorMessage = ref('');
  const visibleCount = ref(0);
  const statusMessage = computed(() => {
    if (errorMessage.value) return errorMessage.value;
    if (isSyncing.value) return messages.driveLoadPage.status.syncing;
    return messages.driveLoadPage.status.refreshed;
  });
  const displayedItems = computed(() => items.value.slice(0, visibleCount.value));
  const nextPageToken = ref(null);

  let disposed = false;
  const abortControllers = new Set();
  const cacheMap = new Map();

  function handleError(error, context) {
    const fallbackMessage = messages.driveLoadPage.status.error;
    const normalized = error instanceof Error ? error : new Error(fallbackMessage);
    logAndToastError(normalized, { title: messages.driveLoadPage.title, message: fallbackMessage }, context);
    errorMessage.value = normalized.message || fallbackMessage;
    return normalized;
  }

  function updateItemsFromCacheMap() {
    const publicItems = Array.from(cacheMap.values()).map((entry) => stripInternal(entry));
    items.value = sortItems(publicItems);
    if (visibleCount.value === 0 && items.value.length > 0) {
      visibleCount.value = Math.min(DISPLAY_BATCH, items.value.length);
    }
  }

  function storeItems(list) {
    for (const raw of list) {
      const normalized = normalizeMetadataItem(raw);
      if (!normalized) continue;
      const existing = cacheMap.get(normalized.id) || {};
      const merged = {
        ...existing,
        ...normalized,
        lastModifiedAtDrive: normalized.lastModifiedAtDrive ?? existing.lastModifiedAtDrive ?? null,
        createdAt: normalized.createdAt ?? existing.createdAt ?? null,
        shared: normalized.shared ?? existing.shared ?? false,
        hasThumbnail: normalized.hasThumbnail ?? existing.hasThumbnail ?? false,
        thumbnailLink: normalized.thumbnailLink ?? existing.thumbnailLink ?? null,
      };
      cacheMap.set(normalized.id, merged);
    }
    updateItemsFromCacheMap();
  }

  function registerAborter(controller) {
    abortControllers.add(controller);
    return controller;
  }

  function cleanup() {
    disposed = true;
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
  }

  async function syncFromDrive(pageToken = null) {
    if (disposed) return;
    isSyncing.value = true;
    isFetchingMore.value = Boolean(pageToken);
    errorMessage.value = '';
    const controller = registerAborter(new AbortController());
    try {
      const pageSize = pageToken ? NEXT_PAGE_SIZE : INITIAL_PAGE_SIZE;
      const { files, nextPageToken: token } = await requestDrivePage({ pageSize, pageToken, abortSignal: controller.signal });
      storeItems(files);
      nextPageToken.value = token || null;
    } catch (error) {
      handleError(error, 'syncFromDrive');
    } finally {
      abortControllers.delete(controller);
      isSyncing.value = false;
      isFetchingMore.value = false;
    }
  }

  function shouldPrefetch() {
    return !isSyncing.value && !isFetchingMore.value && nextPageToken.value && visibleCount.value + PREFETCH_BUFFER >= items.value.length;
  }

  async function revealMore() {
    const nextVisible = Math.min(items.value.length, visibleCount.value + DISPLAY_BATCH);
    if (nextVisible > visibleCount.value) {
      visibleCount.value = nextVisible;
    }
    if (shouldPrefetch()) {
      await syncFromDrive(nextPageToken.value);
    }
  }

  async function initialize() {
    disposed = false;
    visibleCount.value = DISPLAY_BATCH;
    nextPageToken.value = null;
    cacheMap.clear();
    items.value = [];
    isLoadingCache.value = false;
    await syncFromDrive();
  }

  function selectCharacter(id, initialData) {
    if (!id) return;
    if (initialData) {
      uiStore.setPrefetchedDriveData(id, initialData);
    }
    uiStore.setCurrentDriveFileId(id);
  }

  return {
    displayedItems,
    isLoadingCache,
    isSyncing,
    isFetchingMore,
    statusMessage,
    errorMessage,
    nextPageToken,
    initialize,
    revealMore,
    cleanup,
    refresh: () => syncFromDrive(),
    selectCharacter,
  };
}
