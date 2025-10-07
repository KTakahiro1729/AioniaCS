import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';
import { messages } from '../../../src/locales/ja.js';

const showToastMock = vi.fn();

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: showToastMock }),
}));

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    showToastMock.mockClear();
    window.location.hash = '';
  });

  test('loads shared data when Drive share hash is present', async () => {
    window.location.hash = '#/share/drive/file-abc';
    const payload = {
      character: { name: 'Hero' },
      skills: [{ id: 's1' }],
      specialSkills: [],
      equipments: { weapon: 'Sword' },
      histories: [],
    };
    const loadFileContent = vi.fn().mockResolvedValue(JSON.stringify(payload));
    const dataManager = { googleDriveManager: { loadFileContent } };
    const { initialize } = useAppInitialization(dataManager);
    await initialize();

    expect(loadFileContent).toHaveBeenCalledWith('file-abc');
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    expect(charStore.character.name).toBe('Hero');
    expect(uiStore.isViewingShared).toBe(true);
    expect(uiStore.isLoading).toBe(false);
    expect(showToastMock).not.toHaveBeenCalled();
  });

  test('does nothing when hash is not a share link', async () => {
    window.location.hash = '#/other';
    const loadFileContent = vi.fn();
    const { initialize } = useAppInitialization({ googleDriveManager: { loadFileContent } });
    await initialize();
    expect(loadFileContent).not.toHaveBeenCalled();
    const uiStore = useUiStore();
    expect(uiStore.isViewingShared).toBe(false);
  });

  test('notifies user when fetching shared data fails', async () => {
    window.location.hash = '#/share/drive/missing';
    const loadFileContent = vi.fn().mockResolvedValue(null);
    const { initialize } = useAppInitialization({ googleDriveManager: { loadFileContent } });
    await initialize();
    expect(showToastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: messages.share.errors.fetchFailed,
      }),
    );
  });

  test('notifies user when Google Drive manager is unavailable', async () => {
    window.location.hash = '#/share/drive/file-abc';
    const { initialize } = useAppInitialization({ googleDriveManager: null });
    await initialize();
    expect(showToastMock).toHaveBeenCalledWith(expect.objectContaining({ message: messages.share.errors.managerMissing }));
  });
});
