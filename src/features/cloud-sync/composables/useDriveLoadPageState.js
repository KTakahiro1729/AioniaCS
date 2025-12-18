import { computed, ref } from 'vue';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/i18n/index.js';

const DISPLAY_BATCH = 10;
const PREFETCH_BUFFER = 10;
const INITIAL_PAGE_SIZE = 20;
const NEXT_PAGE_SIZE = 10;

export function normalizeMetadataItem(raw) {
  const id = raw?.fileId || raw?.file_id || raw?.id;
  if (!id) return null;

  const characterName =
    raw?.characterName || raw?.character_name || raw?.appProperties?.character_name || raw?.app_properties?.character_name || '';
  const fileName = raw?.fileName || raw?.file_name || raw?.name || '';
  const contentHash =
    raw?.contentHash || raw?.content_hash || raw?.appProperties?.last_app_hash || raw?.app_properties?.last_app_hash || null;
  const modified = raw?.lastModifiedAtDrive || raw?.last_modified_at_drive || raw?.modifiedTime;
  const lastModifiedAtDrive = modified ? Math.floor(new Date(modified).getTime() / 1000) : null;
  const syncedAt = raw?.syncedAt || raw?.synced_at || null;
  const outOfSync = Boolean(raw?.outOfSync || raw?.out_of_sync || raw?.hashMismatch || raw?.modifiedMismatch);

  return { id, characterName, fileName, contentHash, lastModifiedAtDrive, syncedAt, outOfSync };
}

function buildSyncSource(item) {
  const normalized = normalizeMetadataItem(item);
  if (!normalized) return null;
  return {
    id: normalized.id,
    name: normalized.fileName,
    modifiedTime: normalized.lastModifiedAtDrive ? new Date(normalized.lastModifiedAtDrive * 1000).toISOString() : undefined,
    appProperties:
      normalized.contentHash || normalized.characterName
        ? {
            last_app_hash: normalized.contentHash || undefined,
            character_name: normalized.characterName || undefined,
          }
        : undefined,
  };
}

function sortItems(list) {
  return [...list].sort((a, b) => {
    const left = a.lastModifiedAtDrive || 0;
    const right = b.lastModifiedAtDrive || 0;
    if (left !== right) return right - left;
    return (a.fileName || '').localeCompare(b.fileName || '');
  });
}

function stripInternal(entry) {
  const { ...rest } = entry;
  delete rest.cachedOnly;
  delete rest.syncSource;
  return rest;
}

async function defaultRequestDrivePage(driveManager, { pageSize, pageToken, abortSignal }) {
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

  const response = await gapiClient.client.drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
    fields: 'nextPageToken, files(id, name, modifiedTime, appProperties)',
    spaces: 'drive',
    pageSize,
    pageToken,
  });

  if (abortSignal?.aborted) {
    return { files: [], nextPageToken: null };
  }

  return { files: response.result.files || [], nextPageToken: response.result.nextPageToken || null };
}

export function useDriveLoadPageState(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const driveManager = options.driveManager || getGoogleDriveManagerInstance();
  const requestDrivePage = options.requestDrivePage || ((params) => defaultRequestDrivePage(driveManager, params));
  const metadataEndpoint = options.metadataEndpoint || '/api/drive/metadata';
  const syncEndpoint = options.syncEndpoint || '/api/drive/sync';
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
    if (isLoadingCache.value) return messages.driveLoadPage.status.loadingCache;
    return messages.driveLoadPage.status.refreshed;
  });
  const displayedItems = computed(() => items.value.slice(0, visibleCount.value));
  const nextPageToken = ref(null);

  let disposed = false;
  let fetchedAllPages = false;
  const abortControllers = new Set();
  const cacheMap = new Map();

  function handleError(error, context) {
    const fallbackMessage = messages.driveLoadPage.status.error;
    const normalized = error instanceof Error ? error : new Error(fallbackMessage);
    logAndToastError(normalized, { title: messages.driveLoadPage.title, message: fallbackMessage }, context);
    errorMessage.value = normalized.message || fallbackMessage;
    return normalized;
  }

  function getSyncPayload(includeCachedPlaceholders) {
    const entries = Array.from(cacheMap.values());
    const source = includeCachedPlaceholders ? entries : entries.filter((item) => !item.cachedOnly);
    return source.map((entry) => ({
      id: entry.id,
      name: entry.syncSource?.name || entry.fileName,
      modifiedTime:
        entry.syncSource?.modifiedTime ||
        (entry.lastModifiedAtDrive ? new Date(entry.lastModifiedAtDrive * 1000).toISOString() : undefined),
      appProperties:
        entry.syncSource?.appProperties ||
        (entry.contentHash || entry.characterName
          ? { last_app_hash: entry.contentHash || undefined, character_name: entry.characterName || undefined }
          : undefined),
    }));
  }

  function updateItemsFromCacheMap() {
    const publicItems = Array.from(cacheMap.values()).map((entry) => stripInternal(entry));
    items.value = sortItems(publicItems);
    if (visibleCount.value === 0 && items.value.length > 0) {
      visibleCount.value = Math.min(DISPLAY_BATCH, items.value.length);
    }
  }

  function storeItems(list, { cachedOnly = false } = {}) {
    for (const raw of list) {
      const normalized = normalizeMetadataItem(raw);
      if (!normalized) continue;
      cacheMap.set(normalized.id, {
        ...normalized,
        cachedOnly,
        syncSource: raw.syncSource || buildSyncSource(raw),
      });
    }
    updateItemsFromCacheMap();
  }

  function removeCachedOnly() {
    for (const [key, entry] of cacheMap.entries()) {
      if (entry.cachedOnly) {
        cacheMap.delete(key);
      }
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

  function applySyncResponse(syncItems) {
    if (!Array.isArray(syncItems)) return;
    const mapped = syncItems.map((item) => ({ ...item, syncSource: buildSyncSource(item) }));
    storeItems(mapped, { cachedOnly: false });
  }

  async function postSync(payload) {
    if (!payload || payload.length === 0) {
      return [];
    }
    const controller = registerAborter(new AbortController());
    try {
      const response = await fetchImpl(syncEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payload }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(messages.driveLoadPage.errors.syncFailed);
      }
      const data = await response.json();
      return Array.isArray(data?.items) ? data.items : [];
    } finally {
      abortControllers.delete(controller);
    }
  }

  async function fetchCachedMetadata() {
    isLoadingCache.value = true;
    errorMessage.value = '';
    const controller = registerAborter(new AbortController());
    try {
      const response = await fetchImpl(metadataEndpoint, { credentials: 'include', signal: controller.signal });
      if (!response.ok) {
        throw new Error(messages.driveLoadPage.errors.cacheFailed);
      }
      const data = await response.json();
      const incoming = Array.isArray(data?.items) ? data.items : [];
      storeItems(incoming, { cachedOnly: true });
    } catch (error) {
      handleError(error, 'fetchCachedMetadata');
    } finally {
      abortControllers.delete(controller);
      if (!disposed) {
        isLoadingCache.value = false;
      }
    }
  }

  async function syncFromDrive(pageToken = null) {
    if (disposed) return;
    isSyncing.value = true;
    isFetchingMore.value = Boolean(pageToken);
    errorMessage.value = '';
    try {
      const pageSize = pageToken ? NEXT_PAGE_SIZE : INITIAL_PAGE_SIZE;
      const { files, nextPageToken: token } = await requestDrivePage({ pageSize, pageToken, abortSignal: null });
      storeItems(files, { cachedOnly: false });
      nextPageToken.value = token || null;
      fetchedAllPages = !token;
      const payload = getSyncPayload(!fetchedAllPages);
      const syncItems = await postSync(payload);
      applySyncResponse(syncItems);
      if (fetchedAllPages) {
        removeCachedOnly();
      }
    } catch (error) {
      handleError(error, 'syncFromDrive');
    } finally {
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
    fetchedAllPages = false;
    nextPageToken.value = null;
    cacheMap.clear();
    items.value = [];
    await fetchCachedMetadata();
    syncFromDrive();
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
  };
}
