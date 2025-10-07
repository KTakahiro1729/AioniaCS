import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useCharacterStore();
    store.character = { name: 'Hero', images: [] };
    store.skills = [];
    store.specialSkills = [];
    store.equipments = {};
    store.histories = [];
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('rejects when Google Drive manager is missing', async () => {
    const { generateShare } = useShare({ googleDriveManager: null });
    await expect(generateShare()).rejects.toThrow('サインインしてください');
  });

  test('rejects when saveFile returns null', async () => {
    const googleDriveManager = {
      saveFile: vi.fn().mockResolvedValue(null),
      setPermissionToPublic: vi.fn(),
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-1'),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare()).rejects.toThrow('Google Drive へのアップロードに失敗しました');
  });

  test('rejects when permission update fails', async () => {
    const googleDriveManager = {
      saveFile: vi.fn().mockResolvedValue({ id: 'share-1' }),
      setPermissionToPublic: vi.fn().mockRejectedValue(new Error('boom')),
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-1'),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare()).rejects.toThrow('Google Drive の共有設定に失敗しました');
  });

  test('returns share link and stores record on success', async () => {
    const googleDriveManager = {
      saveFile: vi.fn().mockResolvedValue({ id: 'share-xyz' }),
      setPermissionToPublic: vi.fn().mockResolvedValue(undefined),
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-1'),
    };
    const { generateShare } = useShare({ googleDriveManager });
    const link = await generateShare();

    expect(link).toContain('shareId=share-xyz');
    expect(googleDriveManager.saveFile).toHaveBeenCalledWith(
      'folder-1',
      expect.stringContaining('AioniaCS Share'),
      expect.any(String),
      null,
      'application/json',
    );
    const stored = JSON.parse(window.localStorage.getItem('aioniacs.share.records'));
    expect(stored['AioniaCS Share - Hero.json'].id).toBe('share-xyz');
  });
});
