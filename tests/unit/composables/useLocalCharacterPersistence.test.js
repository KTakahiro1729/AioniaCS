import { nextTick } from 'vue';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import {
  useLocalCharacterPersistence,
  LOCAL_CHARACTER_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  removeStoredCharacterDraft,
} from '@/features/character-sheet/composables/useLocalCharacterPersistence.js';

function createMockStorage() {
  const map = new Map();
  return {
    getItem: vi.fn((key) => (map.has(key) ? map.get(key) : null)),
    setItem: vi.fn((key, value) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key) => {
      map.delete(key);
    }),
  };
}

describe('useLocalCharacterPersistence', () => {
  let storage;
  let historyStorage;

  beforeEach(() => {
    setActivePinia(createPinia());
    storage = createMockStorage();
    historyStorage = createMockStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function mountComposable(options = {}) {
    const characterStore = useCharacterStore();
    const resolvedOptions = { debounceMs: 0, ...options };
    if (!Object.prototype.hasOwnProperty.call(resolvedOptions, 'storage')) {
      resolvedOptions.storage = storage;
    }
    if (!Object.prototype.hasOwnProperty.call(resolvedOptions, 'historyStorage')) {
      resolvedOptions.historyStorage = historyStorage;
    }
    const instance = useLocalCharacterPersistence(characterStore, resolvedOptions);
    return { instance, characterStore };
  }

  test('uses sessionStorage by default when available', async () => {
    const sessionStorageMock = createMockStorage();
    const localStorageMock = createMockStorage();
    vi.stubGlobal('window', {
      sessionStorage: sessionStorageMock,
      localStorage: localStorageMock,
    });
    const characterStore = useCharacterStore();
    useLocalCharacterPersistence(characterStore, { debounceMs: 0 });

    characterStore.character.name = 'Session Scoped';
    await nextTick();
    vi.runAllTimers();

    expect(sessionStorageMock.setItem).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('hydrates store state from localStorage payload', () => {
    const payload = {
      character: { name: 'Local Hero', species: 'human' },
      skills: [{ id: 'athletics', name: '運動', checked: true, canHaveExperts: false }],
      specialSkills: [{ group: 'tactics', name: '隠密', note: '', showNote: false }],
      equipments: { weapon1: { group: 'sword', name: '剣' } },
      histories: [{ sessionName: 'Session 1', memo: 'notes' }],
    };
    storage.setItem(LOCAL_CHARACTER_STORAGE_KEY, JSON.stringify(payload));
    const { characterStore } = mountComposable();

    expect(characterStore.character.name).toBe('Local Hero');
    expect(characterStore.skills[0].name).toBe('運動');
    expect(characterStore.specialSkills[0].name).toBe('隠密');
    expect(characterStore.equipments.weapon1.name).toBe('剣');
    expect(characterStore.histories[0].sessionName).toBe('Session 1');
  });

  test('persists changes with debounce to localStorage', async () => {
    const { characterStore } = mountComposable();
    characterStore.character.name = 'Auto Save';

    await nextTick();
    vi.runAllTimers();

    expect(storage.setItem).toHaveBeenCalled();
    const saved = JSON.parse(storage.getItem(LOCAL_CHARACTER_STORAGE_KEY));
    expect(saved.character.name).toBe('Auto Save');
  });

  test('persists history without images when data changes', async () => {
    const { characterStore } = mountComposable({ historyDebounceMs: 0 });
    characterStore.character.images = ['data:image/png;base64,sample'];
    characterStore.character.name = 'History Save';

    await nextTick();
    vi.runAllTimers();

    expect(historyStorage.setItem).toHaveBeenCalled();
    const savedHistory = JSON.parse(historyStorage.getItem(HISTORY_STORAGE_KEY));
    expect(savedHistory[0].data.character.images).toEqual([]);
    expect(savedHistory[0].meta.name).toBe('History Save');
  });

  test('clearLocalDraft removes stored payload', () => {
    storage.setItem(LOCAL_CHARACTER_STORAGE_KEY, JSON.stringify({ character: { name: 'To Remove' } }));
    removeStoredCharacterDraft(storage);
    expect(storage.removeItem).toHaveBeenCalledWith(LOCAL_CHARACTER_STORAGE_KEY);
  });

  test('restoreFromHistory hydrates store from provided history item', () => {
    const { instance, characterStore } = mountComposable();
    const historyItem = {
      data: {
        character: { name: 'Recovered', species: 'human' },
        skills: [{ id: 'a', name: 'Skill A' }],
        specialSkills: [{ group: 'tactics', name: 'Stealth', note: '', showNote: false }],
        equipments: { weapon1: { group: 'blade', name: 'Sword' } },
        histories: [{ sessionName: 'Old Session' }],
      },
    };

    const restored = instance.restoreFromHistory(historyItem);

    expect(restored).toBe(true);
    expect(characterStore.character.name).toBe('Recovered');
    expect(characterStore.skills[0].name).toBe('Skill A');
    expect(characterStore.specialSkills[0].name).toBe('Stealth');
    expect(characterStore.equipments.weapon1.name).toBe('Sword');
    expect(characterStore.histories[0].sessionName).toBe('Old Session');
  });

  test('getHistoryList returns parsed history', () => {
    historyStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([{ data: { character: { name: 'History' } }, meta: { name: 'History' } }]));
    const { instance } = mountComposable();

    expect(instance.getHistoryList()).toHaveLength(1);
    expect(instance.getHistoryList()[0].meta.name).toBe('History');
  });

  test('does not persist history when no significant change exists', async () => {
    mountComposable({ historyDebounceMs: 0 });

    await nextTick();
    vi.runAllTimers();

    expect(historyStorage.setItem).not.toHaveBeenCalled();
  });
});
