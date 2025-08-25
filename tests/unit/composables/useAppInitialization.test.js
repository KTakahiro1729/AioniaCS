import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/libs/sabalessshare/src/url.js', () => ({
  parseShareUrl: vi.fn(),
}));

vi.mock('../../../src/libs/sabalessshare/src/index.js', () => ({
  receiveSharedData: vi.fn(),
}));

vi.mock('../../../src/libs/sabalessshare/src/dynamic.js', () => ({
  receiveDynamicData: vi.fn(),
}));

vi.mock('../../../src/services/driveStorageAdapter.js', () => ({
  DriveStorageAdapter: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test('loads shared data when URL has params', async () => {
    const { parseShareUrl } = await import('../../../src/libs/sabalessshare/src/url.js');
    const { receiveSharedData } = await import('../../../src/libs/sabalessshare/src/index.js');
    parseShareUrl.mockReturnValue({ mode: 'simple' });
    const payload = {
      character: { name: 'Hero' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const buffer = Uint8Array.from(Buffer.from(JSON.stringify(payload))).buffer;
    receiveSharedData.mockResolvedValue(buffer);

    const dataManager = { googleDriveManager: {} };
    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    expect(parseShareUrl).toHaveBeenCalled();
    expect(receiveSharedData).toHaveBeenCalled();
    expect(uiStore.isViewingShared).toBe(true);
    expect(charStore.character.name).toBe('Hero');
  });

  test('does nothing when no params', async () => {
    const { parseShareUrl } = await import('../../../src/libs/sabalessshare/src/url.js');
    parseShareUrl.mockReturnValue(null);
    const dataManager = { googleDriveManager: {} };
    const { initialize } = useAppInitialization(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Default';
    await initialize();
    const uiStore = useUiStore();
    expect(uiStore.isViewingShared).toBe(false);
    expect(charStore.character.name).toBe('Default');
  });

  test('updates loading state', async () => {
    const { parseShareUrl } = await import('../../../src/libs/sabalessshare/src/url.js');
    const { receiveSharedData } = await import('../../../src/libs/sabalessshare/src/index.js');
    parseShareUrl.mockReturnValue({ mode: 'simple' });
    let resolve;
    receiveSharedData.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { initialize } = useAppInitialization({ googleDriveManager: {} });
    const uiStore = useUiStore();
    const p = initialize();
    expect(uiStore.isLoading).toBe(true);
    const payload = {
      character: { name: 'Test' },
      playerName: 'Test',
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const buffer = new TextEncoder().encode(JSON.stringify(payload)).buffer;
    resolve(buffer);
    await p;
    expect(uiStore.isLoading).toBe(false);
  });
});
