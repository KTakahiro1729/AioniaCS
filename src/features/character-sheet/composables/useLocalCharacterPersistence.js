import { watch, onMounted } from 'vue';

export const LOCAL_CHARACTER_STORAGE_KEY = 'aionia-character';

function resolveStorage(customStorage) {
  if (typeof customStorage !== 'undefined') {
    return customStorage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function removeStoredCharacterDraft(storage = resolveStorage(), storageKey = LOCAL_CHARACTER_STORAGE_KEY) {
  if (!storage) {
    return;
  }
  storage.removeItem(storageKey);
}

export function useLocalCharacterPersistence(characterStore, uiStore, options = {}) {
  const storage = resolveStorage(options.storage);
  const storageKey = options.storageKey || LOCAL_CHARACTER_STORAGE_KEY;
  const debounceMs = typeof options.debounceMs === 'number' ? options.debounceMs : 500;
  let debounceHandle = null;

  function persistToStorage() {
    if (!storage || uiStore.isViewingShared) {
      return false;
    }
    const payload = {
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
    };
    try {
      storage.setItem(storageKey, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('Failed to persist local character data:', error);
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

  function hydrateFromStorage() {
    if (!storage) {
      return false;
    }
    const raw = storage.getItem(storageKey);
    if (!raw) {
      return false;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return false;
      }
      if (parsed.character && typeof parsed.character === 'object') {
        Object.assign(characterStore.character, parsed.character);
      }
      if (Array.isArray(parsed.skills)) {
        characterStore.skills.splice(0, characterStore.skills.length, ...parsed.skills);
      }
      if (Array.isArray(parsed.specialSkills)) {
        characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsed.specialSkills);
      }
      if (parsed.equipments && typeof parsed.equipments === 'object') {
        Object.assign(characterStore.equipments, parsed.equipments);
      }
      if (Array.isArray(parsed.histories)) {
        characterStore.histories.splice(0, characterStore.histories.length, ...parsed.histories);
      }
      return true;
    } catch (error) {
      console.warn('Failed to restore local character data:', error);
      removeStoredCharacterDraft(storage, storageKey);
      return false;
    }
  }

  hydrateFromStorage();

  const stopPersistenceWatch = watch(
    () => ({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
    }),
    () => {
      schedulePersist();
    },
    { deep: true },
  );

  const stopSharedWatch = watch(
    () => uiStore.isViewingShared,
    (isViewingShared) => {
      if (!isViewingShared) {
        schedulePersist();
      }
    },
  );

  onMounted(() => {
    hydrateFromStorage();
  });

  const stop = () => {
    if (debounceHandle) {
      clearTimeout(debounceHandle);
      debounceHandle = null;
    }
    stopPersistenceWatch?.();
    stopSharedWatch?.();
  };

  return {
    hydrateFromStorage,
    persistToStorage,
    clearLocalDraft: () => removeStoredCharacterDraft(storage, storageKey),
    stop,
  };
}
