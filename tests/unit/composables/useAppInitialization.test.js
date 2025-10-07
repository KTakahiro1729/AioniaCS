import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/utils/characterSerialization.js', () => ({
  deserializeCharacterPayload: vi.fn(),
}));

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  test('loads shared data when shareId is present', async () => {
    const { deserializeCharacterPayload } = await import('../../../src/utils/characterSerialization.js');
    deserializeCharacterPayload.mockResolvedValue({
      character: { name: 'Hero' },
      skills: [{ id: 1 }],
      specialSkills: [],
      equipments: { weapon1: { name: 'Sword' } },
      histories: [{ sessionName: 'Session' }],
    });

    const loadFileContent = vi.fn().mockResolvedValue('{}');
    const dataManager = { googleDriveManager: { loadFileContent } };

    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    window.history.replaceState(null, '', '/?shareId=test-id');
    replaceSpy.mockClear();

    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    expect(loadFileContent).toHaveBeenCalledWith('test-id');
    expect(deserializeCharacterPayload).toHaveBeenCalledWith('{}');
    expect(charStore.character.name).toBe('Hero');
    expect(charStore.skills).toHaveLength(1);
    expect(uiStore.isViewingShared).toBe(true);
    expect(replaceSpy).toHaveBeenCalledWith(null, '', '/');
    replaceSpy.mockRestore();
  });

  test('does nothing when shareId is missing', async () => {
    const dataManager = { googleDriveManager: { loadFileContent: vi.fn() } };
    const { initialize } = useAppInitialization(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Default';
    await initialize();
    const uiStore = useUiStore();
    expect(uiStore.isViewingShared).toBe(false);
    expect(charStore.character.name).toBe('Default');
  });

  test('updates loading state while fetching', async () => {
    const { deserializeCharacterPayload } = await import('../../../src/utils/characterSerialization.js');
    let resolve;
    const loadFileContent = vi.fn().mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    deserializeCharacterPayload.mockResolvedValue({ character: {}, skills: [], specialSkills: [], equipments: {}, histories: [] });
    const dataManager = { googleDriveManager: { loadFileContent } };
    window.history.replaceState(null, '', '/?shareId=loading-test');
    const { initialize } = useAppInitialization(dataManager);
    const uiStore = useUiStore();
    const initPromise = initialize();
    expect(uiStore.isLoading).toBe(true);
    resolve('{}');
    await initPromise;
    expect(uiStore.isLoading).toBe(false);
  });
});
