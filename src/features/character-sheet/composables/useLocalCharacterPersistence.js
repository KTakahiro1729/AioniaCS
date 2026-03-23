import { watch } from 'vue';
import { deepClone } from '@/shared/utils/utils.js';
import { removeImagesFromData, hasSignificantChange } from '../utils/characterHistoryUtils.js';

export const LOCAL_CHARACTER_STORAGE_KEY = 'aionia-character';
export const HISTORY_STORAGE_KEY = 'aionia-local-history';
export const MAX_HISTORY_COUNT = 3;

function resolveStorage(customStorage, defaultStorageKey) {
  if (typeof customStorage !== 'undefined') {
    return customStorage;
  }
  if (typeof window !== 'undefined' && window[defaultStorageKey]) {
    return window[defaultStorageKey];
  }
  return null;
}

export function removeStoredCharacterDraft(
  storage = resolveStorage(undefined, 'sessionStorage'),
  storageKey = LOCAL_CHARACTER_STORAGE_KEY,
) {
  if (!storage) {
    return;
  }
  storage.removeItem(storageKey);
}

function buildStorePayload(characterStore) {
  return {
    character: characterStore.character,
    skills: characterStore.skills,
    specialSkills: characterStore.specialSkills,
    equipments: characterStore.equipments,
    histories: characterStore.histories,
  };
}

function safeParse(raw) {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse stored character data:', error);
    return null;
  }
}

export function useLocalCharacterPersistence(characterStore, uiStore, options = {}) {
  const storage = resolveStorage(options.storage, 'sessionStorage');
  const historyStorage = resolveStorage(options.historyStorage, 'localStorage');
  const storageKey = options.storageKey || LOCAL_CHARACTER_STORAGE_KEY;
  const historyStorageKey = options.historyStorageKey || HISTORY_STORAGE_KEY;
  const debounceMs = typeof options.debounceMs === 'number' ? options.debounceMs : 500;
  const historyDebounceMs = typeof options.historyDebounceMs === 'number' ? options.historyDebounceMs : 1000;
  let debounceHandle = null;
  let historyDebounceHandle = null;

  const defaultPayload = deepClone(buildStorePayload(characterStore));

  function persistToStorage() {
    if (!storage || uiStore.isViewingShared) {
      return false;
    }
    const payload = buildStorePayload(characterStore);
    try {
      storage.setItem(storageKey, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('Failed to persist local character data:', error);
      return false;
    }
  }

  function persistToHistory() {
    if (!historyStorage || uiStore.isViewingShared) {
      return false;
    }
    const payload = buildStorePayload(characterStore);
    if (!hasSignificantChange(payload, defaultPayload)) {
      return false;
    }
    const currentHistory = safeParse(historyStorage.getItem(historyStorageKey)) || [];
    const cloned = removeImagesFromData(deepClone(payload));
    const meta = {
      name: cloned.character?.name || '名称未設定',
      species: cloned.character?.species || '',
      occupation: cloned.character?.occupation || '',
      updatedAt: new Date().toISOString(),
    };
    const historyItem = {
      id: cloned.character?.id,
      timestamp: Date.now(),
      meta,
      data: cloned,
    };
    const filtered = Array.isArray(currentHistory)
      ? currentHistory.filter((item) => item?.data?.character?.id !== historyItem.data?.character?.id)
      : [];
    filtered.unshift(historyItem);
    if (filtered.length > MAX_HISTORY_COUNT) {
      filtered.length = MAX_HISTORY_COUNT;
    }
    try {
      historyStorage.setItem(historyStorageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.warn('Failed to persist character history:', error);
      return false;
    }
  }

  function schedulePersist() {
    if (!storage || uiStore.isViewingShared) {
      return;
    }
    if (debounceHandle) {
      clearTimeout(debounceHandle);
    }
    debounceHandle = setTimeout(() => {
      persistToStorage();
      debounceHandle = null;
    }, debounceMs);
  }

  function scheduleHistoryPersist() {
    if (!historyStorage || uiStore.isViewingShared) {
      return;
    }
    if (historyDebounceHandle) {
      clearTimeout(historyDebounceHandle);
    }
    historyDebounceHandle = setTimeout(() => {
      persistToHistory();
      historyDebounceHandle = null;
    }, historyDebounceMs);
  }

  function hydrateFromStorage() {
    if (!storage) {
      return false;
    }
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return false;
    }
    const parsed = safeParse(raw);
    if (!parsed) {
      return false;
    }
    characterStore.hydrateFromData(parsed);
    return true;
  }

  function getHistoryList() {
    if (!historyStorage) {
      return [];
    }
    const parsed = safeParse(historyStorage.getItem(historyStorageKey));
    return Array.isArray(parsed) ? parsed : [];
  }

  function restoreFromHistory(historyItem) {
    if (!historyItem || !historyItem.data) {
      return false;
    }
    characterStore.hydrateFromData(historyItem.data);
    return true;
  }

  hydrateFromStorage();

  const stopPersistenceWatch = watch(
    () => buildStorePayload(characterStore),
    () => {
      schedulePersist();
      scheduleHistoryPersist();
    },
    { deep: true },
  );

  const stopSharedWatch = watch(
    () => uiStore.isViewingShared,
    (isViewingShared) => {
      if (!isViewingShared) {
        schedulePersist();
        scheduleHistoryPersist();
      }
    },
  );

  const stop = () => {
    if (debounceHandle) {
      clearTimeout(debounceHandle);
      debounceHandle = null;
    }
    if (historyDebounceHandle) {
      clearTimeout(historyDebounceHandle);
      historyDebounceHandle = null;
    }
    stopPersistenceWatch?.();
    stopSharedWatch?.();
  };

  return {
    hydrateFromStorage,
    persistToStorage,
    persistToHistory,
    getHistoryList,
    restoreFromHistory,
    clearLocalDraft: () => removeStoredCharacterDraft(storage, storageKey),
    stop,
  };
}
