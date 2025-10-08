import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useCharacterStore();
    store.character = { name: 'Hero' };
    store.skills = [];
    store.specialSkills = [];
    store.equipments = {};
    store.histories = [];
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.clearCurrentDriveFileId();
  });

  test('rejects when Google Drive manager is missing or signed out', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const { generateShareLink } = useShare({ googleDriveManager: null, saveCharacterToDrive: vi.fn() });
    await expect(generateShareLink()).rejects.toThrow('共有機能を利用するにはGoogle Driveにサインインしてください');
  });

  test('rejects when saving fails to produce a file id', async () => {
    const saveCharacterToDrive = vi.fn().mockResolvedValue(null);
    const { generateShareLink } = useShare({
      googleDriveManager: { shareCharacterFile: vi.fn() },
      saveCharacterToDrive,
    });
    await expect(generateShareLink()).rejects.toThrow('Google Drive への保存に失敗しました');
  });

  test('rejects when shareCharacterFile returns null', async () => {
    const saveCharacterToDrive = vi.fn().mockResolvedValue({ id: 'file-1' });
    const shareCharacterFile = vi.fn().mockResolvedValue(null);
    const { generateShareLink } = useShare({
      googleDriveManager: { shareCharacterFile },
      saveCharacterToDrive,
    });
    await expect(generateShareLink()).rejects.toThrow('共有リンクの取得に失敗しました');
    expect(saveCharacterToDrive).toHaveBeenCalled();
  });
});
