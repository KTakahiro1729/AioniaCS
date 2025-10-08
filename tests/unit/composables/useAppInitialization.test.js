const { mockShowToast, mockDeserialize } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
  mockDeserialize: vi.fn(),
}));

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock('../../../src/utils/characterSerialization.js', () => ({
  deserializeCharacterPayload: mockDeserialize,
}));

import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useUiStore } from '../../../src/stores/uiStore.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

describe('useAppInitialization', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockShowToast.mockClear();
    mockDeserialize.mockReset();
    window.history.replaceState({}, '', `${window.location.origin}/`);
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete global.fetch;
    }
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
    expect(mockShowToast).not.toHaveBeenCalled();
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

    const dataManager = { parseLoadedData: vi.fn().mockReturnValue(parsedData) };

    const uiStore = useUiStore();
    const characterStore = useCharacterStore();

    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    expect(global.fetch).toHaveBeenCalledWith('https://drive.google.com/uc?export=download&id=file123');
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
    expect(mockShowToast).not.toHaveBeenCalled();
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
    expect(mockShowToast).toHaveBeenCalled();
  });
});
