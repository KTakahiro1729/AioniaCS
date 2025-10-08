import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

const showToast = vi.fn();

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast }),
}));

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    showToast.mockClear();
    window.location.hash = '#/share/drive/mock-id';
  });

  test('loads shared data when URL has Drive share', async () => {
    const payload = {
      character: { name: 'Shared Hero' },
      skills: [{ name: 'Skill' }],
      specialSkills: [],
      equipments: { weapon: 'Sword' },
      histories: [],
    };
    const googleDriveManager = {
      loadFileContent: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    };
    const dataManager = { googleDriveManager };
    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    expect(charStore.character.name).toBe('Shared Hero');
    expect(charStore.skills).toEqual(payload.skills);
    expect(uiStore.isViewingShared).toBe(true);
    expect(showToast).not.toHaveBeenCalled();
  });

  test('does nothing when URL does not contain share route', async () => {
    window.location.hash = '#/';
    const dataManager = { googleDriveManager: {} };
    const { initialize } = useAppInitialization(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Default';
    await initialize();
    const uiStore = useUiStore();
    expect(uiStore.isViewingShared).toBe(false);
    expect(charStore.character.name).toBe('Default');
    expect(showToast).not.toHaveBeenCalled();
  });

  test('updates loading state while fetching data', async () => {
    const payload = { character: { name: 'Loading' }, skills: [], specialSkills: [], equipments: {}, histories: [] };
    let resolve;
    const googleDriveManager = {
      loadFileContent: vi.fn().mockReturnValue(
        new Promise((r) => {
          resolve = () => r(JSON.stringify(payload));
        }),
      ),
    };
    const { initialize } = useAppInitialization({ googleDriveManager });
    const uiStore = useUiStore();
    const initPromise = initialize();
    expect(uiStore.isLoading).toBe(true);
    resolve();
    await initPromise;
    expect(uiStore.isLoading).toBe(false);
  });

  test('shows toast when sign-in is required', async () => {
    const dataManager = { googleDriveManager: null };
    const { initialize } = useAppInitialization(dataManager);
    await initialize();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: '共有データを読み込むにはGoogle Driveにサインインしてください',
      }),
    );
  });
});
