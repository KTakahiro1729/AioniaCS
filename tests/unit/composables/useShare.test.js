import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    showToast: vi.fn(),
  }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const characterStore = useCharacterStore();
    characterStore.character = { name: 'Hero' };
    characterStore.skills = [];
    characterStore.specialSkills = [];
    characterStore.equipments = {};
    characterStore.histories = [];
    const origin = window.location.origin;
    window.history.replaceState({}, '', `${origin}/app/index.html?foo=1#hash`);
  });

  test('throws when not signed in', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const share = useShare({ googleDriveManager: {} });
    await expect(share.createShareLink()).rejects.toThrow('サインインしてください');
  });

  test('throws when drive manager missing ensureFilePublic', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const share = useShare({ googleDriveManager: {} });
    await expect(share.createShareLink()).rejects.toThrow('Google Drive マネージャーが設定されていません');
  });

  test('throws when save fails', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue(null),
      googleDriveManager: { ensureFilePublic: vi.fn() },
    };
    const share = useShare(dataManager);
    await expect(share.createShareLink()).rejects.toThrow('Google Drive への保存に失敗しました');
  });

  test('throws when share link retrieval fails', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'file123' }),
      googleDriveManager: { ensureFilePublic: vi.fn().mockResolvedValue(null) },
    };
    const share = useShare(dataManager);
    await expect(share.createShareLink()).rejects.toThrow('共有リンクの取得に失敗しました');
  });

  test('returns share link and updates current file id', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'file123' }),
      googleDriveManager: { ensureFilePublic: vi.fn().mockResolvedValue('https://drive.link/file123') },
    };
    const share = useShare(dataManager);
    const link = await share.createShareLink();

    expect(link).toBe(`${window.location.origin}/app/index.html?foo=1&sharedId=file123`);
    expect(uiStore.currentDriveFileId).toBe('file123');
    expect(dataManager.saveCharacterToDrive).toHaveBeenCalled();
    expect(dataManager.googleDriveManager.ensureFilePublic).toHaveBeenCalledWith('file123');
  });
});
