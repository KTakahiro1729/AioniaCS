import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

const originalClipboard = navigator.clipboard;

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const store = useCharacterStore();
    store.character = { name: 'Hero' };
    store.skills = [];
    store.specialSkills = [];
    store.equipments = {};
    store.histories = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue() },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        writable: true,
        value: originalClipboard,
      });
    } else {
      delete navigator.clipboard;
    }
  });

  test('rejects when Google Drive manager is missing', async () => {
    const { generateShare } = useShare({ googleDriveManager: null });
    await expect(generateShare({ includeFull: true })).rejects.toThrow('サインインしてください');
  });

  test('rejects when uploadAndShareFile returns null', async () => {
    const googleDriveManager = {
      uploadAndShareFile: vi.fn().mockResolvedValue(null),
      setPermissionToPublic: vi.fn(),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ includeFull: true })).rejects.toThrow('Google Drive へのアップロードに失敗しました');
  });

  test('rejects when setting permission fails', async () => {
    const googleDriveManager = {
      uploadAndShareFile: vi.fn().mockResolvedValue('file-1'),
      setPermissionToPublic: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ includeFull: false })).rejects.toThrow('Google Drive の公開設定に失敗しました');
    expect(googleDriveManager.uploadAndShareFile).toHaveBeenCalled();
    expect(googleDriveManager.setPermissionToPublic).toHaveBeenCalledWith('file-1');
  });

  test('returns Drive share link on success', async () => {
    const googleDriveManager = {
      uploadAndShareFile: vi.fn().mockImplementation(async (content, fileName) => {
        expect(typeof content).toBe('string');
        expect(fileName).toMatch(/Hero_share_/);
        return 'file-xyz';
      }),
      setPermissionToPublic: vi.fn().mockResolvedValue(true),
    };
    const { generateShare, copyLink } = useShare({ googleDriveManager });
    const link = await generateShare({ includeFull: false });
    const expectedLink = `${window.location.origin}/#/share/drive/file-xyz`;
    expect(link).toBe(expectedLink);
    await copyLink(link);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedLink);
  });
});
