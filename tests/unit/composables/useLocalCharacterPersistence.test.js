import { nextTick } from 'vue';
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import {
  useLocalCharacterPersistence,
  LOCAL_CHARACTER_STORAGE_KEY,
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

  beforeEach(() => {
    setActivePinia(createPinia());
    storage = createMockStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function mountComposable(options = {}) {
    const characterStore = useCharacterStore();
    const uiStore = useUiStore();
    const resolvedOptions = { debounceMs: 0, ...options };
    if (!Object.prototype.hasOwnProperty.call(resolvedOptions, 'storage')) {
      resolvedOptions.storage = storage;
    }
    const instance = useLocalCharacterPersistence(characterStore, uiStore, resolvedOptions);
    return { instance, characterStore, uiStore };
  }

  test('uses sessionStorage by default when available', async () => {
    const sessionStorageMock = createMockStorage();
    const localStorageMock = createMockStorage();
    vi.stubGlobal('window', {
      sessionStorage: sessionStorageMock,
      localStorage: localStorageMock,
    });
    const characterStore = useCharacterStore();
    const uiStore = useUiStore();
    useLocalCharacterPersistence(characterStore, uiStore, { debounceMs: 0 });

    characterStore.character.name = 'Session Scoped';
    await nextTick();
    vi.runAllTimers();

    expect(sessionStorageMock.setItem).toHaveBeenCalled();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
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

  test('skips persistence when viewing shared sheet', async () => {
    const { characterStore, uiStore } = mountComposable();
    uiStore.isViewingShared = true;

    characterStore.character.name = 'Should Not Save';
    await nextTick();
    vi.runAllTimers();

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test('clearLocalDraft removes stored payload', () => {
    storage.setItem(LOCAL_CHARACTER_STORAGE_KEY, JSON.stringify({ character: { name: 'To Remove' } }));
    removeStoredCharacterDraft(storage);
    expect(storage.removeItem).toHaveBeenCalledWith(LOCAL_CHARACTER_STORAGE_KEY);
  });
});
