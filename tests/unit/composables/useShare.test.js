import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { messages } from '../../../src/locales/ja.js';

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useCharacterStore();
    store.character = { name: 'Hero', images: ['data:image/png;base64,xxx'] };
    store.skills = [];
    store.specialSkills = [];
    store.equipments = {};
    store.histories = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('rejects when Google Drive manager is missing', async () => {
    const { generateShare } = useShare({ googleDriveManager: null });
    await expect(generateShare({ includeFull: true })).rejects.toThrow(messages.share.needSignIn().message);
  });

  test('rejects when saveSharedSnapshot returns null', async () => {
    const googleDriveManager = {
      saveSharedSnapshot: vi.fn().mockResolvedValue(null),
      setPermissionToPublic: vi.fn(),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ includeFull: true })).rejects.toThrow(messages.share.errors.saveFailed);
  });

  test('generates share link and sets permission', async () => {
    const googleDriveManager = {
      saveSharedSnapshot: vi.fn().mockResolvedValue({ id: 'file-123', name: 'Hero_shared.json' }),
      setPermissionToPublic: vi.fn().mockResolvedValue(true),
    };
    const { generateShare } = useShare({ googleDriveManager });
    const link = await generateShare({ includeFull: true });
    expect(link).toContain('#/share/drive/file-123');
    const snapshotArgs = googleDriveManager.saveSharedSnapshot.mock.calls[0][0];
    expect(snapshotArgs).toEqual(
      expect.objectContaining({
        name: 'Hero',
        fileId: null,
      }),
    );
    const parsedContent = JSON.parse(snapshotArgs.content);
    expect(parsedContent.version).toBe(1);
    expect(parsedContent.character.name).toBe('Hero');
    expect(googleDriveManager.setPermissionToPublic).toHaveBeenCalledWith('file-123');
  });

  test('updates previously shared file on subsequent runs', async () => {
    const googleDriveManager = {
      saveSharedSnapshot: vi
        .fn()
        .mockResolvedValueOnce({ id: 'file-1', name: 'Hero_shared.json' })
        .mockResolvedValueOnce({ id: 'file-1', name: 'Hero_shared.json' }),
      setPermissionToPublic: vi.fn().mockResolvedValue(true),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await generateShare({ includeFull: false });
    await generateShare({ includeFull: false });
    expect(googleDriveManager.saveSharedSnapshot).toHaveBeenNthCalledWith(2, expect.objectContaining({ fileId: 'file-1' }));
  });
});
