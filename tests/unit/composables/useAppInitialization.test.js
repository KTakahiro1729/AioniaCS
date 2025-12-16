const { mockLogAndToastError, mockDeserialize } = vi.hoisted(() => ({
  mockLogAndToastError: vi.fn(),
  mockDeserialize: vi.fn(),
}));

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    logAndToastError: mockLogAndToastError,
  }),
}));

vi.mock('@/shared/utils/characterSerialization.js', () => ({
  deserializeCharacterPayload: mockDeserialize,
}));

import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '@/app/providers/useAppInitialization.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';

describe('useAppInitialization', () => {
  const originalFetch = global.fetch;
  const originalApiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockLogAndToastError.mockClear();
    mockDeserialize.mockReset();
    window.history.replaceState({}, '', `${window.location.origin}/`);
    import.meta.env.VITE_GOOGLE_API_KEY = originalApiKey;
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete global.fetch;
    }
    import.meta.env.VITE_GOOGLE_API_KEY = originalApiKey;
  });

  test('resets loading state when no shared id is present', async () => {
    global.fetch = vi.fn();
    const uiStore = useUiStore();
    uiStore.setLoading(true);
    uiStore.isViewingShared = true;

    const { initialize } = useAppInitialization({ parseLoadedData: vi.fn() });
    await initialize();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(uiStore.isLoading).toBe(false);
    expect(uiStore.isViewingShared).toBe(false);
    expect(mockLogAndToastError).not.toHaveBeenCalled();
  });

  test('loads shared character data when shared id is present', async () => {
    const buffer = new TextEncoder().encode('dummy').buffer;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(buffer, {
        status: 200,
      }),
    );

    window.history.replaceState({}, '', `${window.location.origin}/?sharedId=file123`);

    const parsedData = {
      character: { name: 'Shared Hero', memo: 'notes' },
      skills: ['skill-a'],
      specialSkills: ['special-a'],
      equipments: {
        weapon1: { group: 'Blade', name: 'Sword' },
        weapon2: { group: '', name: '' },
        armor: { group: '', name: '' },
      },
      histories: ['history-a'],
    };

    mockDeserialize.mockResolvedValueOnce(parsedData);

    const dataManager = {
      parseLoadedData: vi.fn().mockReturnValue(parsedData),
      googleDriveManager: { apiKey: 'drive-api-key' },
    };

    const uiStore = useUiStore();
    const characterStore = useCharacterStore();

    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    expect(global.fetch).toHaveBeenCalledWith('https://www.googleapis.com/drive/v3/files/file123?alt=media&key=drive-api-key');
    expect(mockDeserialize).toHaveBeenCalled();
    expect(dataManager.parseLoadedData).toHaveBeenCalledWith(parsedData);
    expect(uiStore.isViewingShared).toBe(true);
    expect(uiStore.currentDriveFileId).toBeNull();
    expect(characterStore.character.name).toBe('Shared Hero');
    expect(characterStore.skills).toEqual(['skill-a']);
    expect(characterStore.specialSkills).toEqual(['special-a']);
    expect(characterStore.equipments.weapon1).toEqual({ group: 'Blade', name: 'Sword' });
    expect(characterStore.histories).toEqual(['history-a']);
    expect(uiStore.isLoading).toBe(false);
    expect(mockLogAndToastError).not.toHaveBeenCalled();
  });

  test('shows error toast when fetching shared data fails', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 404,
      }),
    );

    window.history.replaceState({}, '', `${window.location.origin}/?sharedId=missing`);

    const dataManager = { parseLoadedData: vi.fn() };
    const uiStore = useUiStore();

    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    expect(uiStore.isViewingShared).toBe(false);
    expect(uiStore.isLoading).toBe(false);
    expect(mockLogAndToastError).toHaveBeenCalled();
  });

  test('falls back to googleusercontent host when no API key is configured', async () => {
    const buffer = new TextEncoder().encode('dummy').buffer;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(buffer, {
        status: 200,
      }),
    );

    window.history.replaceState({}, '', `${window.location.origin}/?sharedId=file999`);

    const parsedData = {
      character: { name: 'Fallback Hero', memo: '' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };

    mockDeserialize.mockResolvedValueOnce(parsedData);

    import.meta.env.VITE_GOOGLE_API_KEY = undefined;

    const dataManager = {
      parseLoadedData: vi.fn().mockReturnValue(parsedData),
    };

    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    expect(global.fetch).toHaveBeenCalledWith('https://drive.usercontent.google.com/download?id=file999&export=download');
  });
});
