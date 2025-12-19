import { computed, ref } from 'vue';
import { getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
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
  const characterName =
    baseName ||
    raw?.characterName ||
    raw?.character_name ||
    raw?.appProperties?.character_name ||
    raw?.app_properties?.character_name ||
    '';
  const driveHash = raw?.appProperties?.last_app_hash || raw?.app_properties?.last_app_hash || null;
  const cachedHash = raw?.contentHash || raw?.content_hash || null;
  const driveModifiedAt = toSeconds(raw?.modifiedTime);
  const cachedModifiedAt = toSeconds(raw?.lastModifiedAtDrive || raw?.last_modified_at_drive);
  const createdAt = toSeconds(raw?.createdTime || raw?.created_time);
  const syncedAt = raw?.syncedAt || raw?.synced_at || null;
  const shared = raw?.shared == null ? null : Boolean(raw.shared);
  const hasThumbnail = raw?.hasThumbnail ?? raw?.has_thumbnail ?? null;
  const thumbnailLink = raw?.thumbnailLink || raw?.thumbnail_link || null;
  const outOfSync = Boolean(raw?.outOfSync || raw?.out_of_sync || raw?.hashMismatch || raw?.modifiedMismatch);
  const lastModifiedAtDrive = driveModifiedAt ?? cachedModifiedAt;
  const contentHash = driveHash || cachedHash || null;

  return {
    id,
    characterName,
    fileName,
    driveHash,
    cachedHash,
    contentHash,
    driveModifiedAt,
    cachedModifiedAt,
    lastModifiedAtDrive,
    createdAt,
    syncedAt,
    shared,
    hasThumbnail: hasThumbnail == null ? null : Boolean(hasThumbnail),
    thumbnailLink,
    outOfSync,
  };
}

function determineOutOfSync(entry) {
  if (!entry) return false;
  if (entry.outOfSync) return true;
  const driveHash = entry.driveHash;
  const cachedHash = entry.cachedHash;
  if (driveHash && cachedHash && driveHash !== cachedHash) return true;

  const driveModifiedAt = entry.driveModifiedAt;
  const baselineModifiedAt = entry.cachedModifiedAt ?? entry.syncedAt ?? null;
  if (driveModifiedAt && baselineModifiedAt && driveModifiedAt > baselineModifiedAt) {
    return true;
  }
  return false;
}

function buildSyncSource(item) {
  const normalized = normalizeMetadataItem(item);
  if (!normalized) return null;
  const lastAppHash = normalized.driveHash || normalized.cachedHash || normalized.contentHash || null;
  return {
    id: normalized.id,
    name: normalized.fileName,
    modifiedTime: normalized.lastModifiedAtDrive ? new Date(normalized.lastModifiedAtDrive * 1000).toISOString() : undefined,
    appProperties:
      lastAppHash || normalized.characterName
        ? {
            last_app_hash: lastAppHash || undefined,
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

  if (abortSignal?.aborted) {
    return { files: [], nextPageToken: null };
  }

  const response = await gapi.client.drive.files.list({
    q: `'${folderId}' in parents and (mimeType='application/zip' or mimeType='application/x-zip-compressed' or mimeType='multipart/x-zip' or mimeType contains 'zip') and trashed=false`,
    fields: 'nextPageToken, files(id, name, createdTime, modifiedTime, appProperties, shared, mimeType, hasThumbnail, thumbnailLink)',
    spaces: 'drive',
    pageSize,
    pageToken,
  });

  return { files: response.result.files || [], nextPageToken: response.result.nextPageToken || null };
}

export function useDriveLoadPageState(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const driveManager = options.driveManager || getGoogleDriveManagerInstance();
  const requestDrivePage = options.requestDrivePage || ((params) => defaultRequestDrivePage(driveManager, params));
  const metadataEndpoint = options.metadataEndpoint || '/api/drive/metadata';
  const syncEndpoint = options.syncEndpoint || '/api/drive/sync';
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
      hasThumbnail: entry.hasThumbnail || undefined,
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
      const existing = cacheMap.get(normalized.id) || {};
      const merged = {
        ...existing,
        ...normalized,
        cachedOnly,
        contentHash: normalized.contentHash ?? existing.contentHash ?? null,
        driveHash: normalized.driveHash ?? existing.driveHash ?? null,
        cachedHash: normalized.cachedHash ?? existing.cachedHash ?? null,
        driveModifiedAt: normalized.driveModifiedAt ?? existing.driveModifiedAt ?? null,
        cachedModifiedAt: normalized.cachedModifiedAt ?? existing.cachedModifiedAt ?? null,
        lastModifiedAtDrive: normalized.lastModifiedAtDrive ?? existing.lastModifiedAtDrive ?? null,
        createdAt: normalized.createdAt ?? existing.createdAt ?? null,
        syncedAt: normalized.syncedAt ?? existing.syncedAt ?? null,
        shared: normalized.shared ?? existing.shared ?? false,
        hasThumbnail: normalized.hasThumbnail ?? existing.hasThumbnail ?? false,
        thumbnailLink: normalized.thumbnailLink ?? existing.thumbnailLink ?? null,
      };
      merged.outOfSync = determineOutOfSync(merged);
      merged.syncSource = existing.syncSource || raw.syncSource || buildSyncSource(raw);
      cacheMap.set(normalized.id, merged);
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

  async function postSync(payload, { allowEmpty = false } = {}) {
    if (!payload || payload.length === 0) {
      if (!allowEmpty) return [];
    }
    const controller = registerAborter(new AbortController());
    try {
      const response = await fetchImpl(syncEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payload || [] }),
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
      if (error?.status === 404 || error?.response?.status === 404) {
        const missingId = error?.fileId || error?.id;
        if (missingId) {
          cacheMap.delete(missingId);
          updateItemsFromCacheMap();
          await postSync(getSyncPayload(true), { allowEmpty: true });
        }
      }
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

  function selectCharacter(id) {
    if (!id) return;
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
