import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useUiStore } from '../../../src/stores/uiStore.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

const showToastMock = vi.fn();

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: showToastMock }),
}));

vi.mock('../../../src/services/driveStorageAdapter.js', () => ({
  DriveStorageAdapter: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('../../../src/libs/sabalessshare/src/index.js', () => ({
  createShareLink: vi.fn(),
}));

vi.mock('../../../src/libs/sabalessshare/src/dynamic.js', () => ({
  createDynamicLink: vi.fn(),
  updateDynamicLink: vi.fn(),
}));

describe('useShare', () => {
  let dataManager;
  let createDynamicLink;
  let updateDynamicLink;

  beforeEach(async () => {
    setActivePinia(createPinia());
    showToastMock.mockReset();
    dataManager = { googleDriveManager: {} };
    ({ createDynamicLink, updateDynamicLink } = await import('../../../src/libs/sabalessshare/src/dynamic.js'));
    createDynamicLink.mockReset();
    updateDynamicLink.mockReset();
    const charStore = useCharacterStore();
    charStore.character.name = 'Hero';
  });

  test('stores dynamic share metadata when creating new link', async () => {
    createDynamicLink.mockResolvedValue({
      shareLink: 'dynamic-link',
      pointerFileId: 'pointer-1',
      key: 'key-1',
      salt: null,
    });
    const { generateShare } = useShare(dataManager);

    const link = await generateShare({ type: 'dynamic', includeFull: false, password: '', expiresInDays: 0 });

    expect(link).toBe('dynamic-link');
    const uiStore = useUiStore();
    expect(uiStore.dynamicShareMetadata).toEqual({
      pointerFileId: 'pointer-1',
      key: 'key-1',
      salt: null,
      shareLink: 'dynamic-link',
      includeFull: false,
      password: null,
    });
  });

  test('updates existing dynamic link when metadata is present', async () => {
    const uiStore = useUiStore();
    uiStore.setDynamicShareMetadata({
      pointerFileId: 'pointer-1',
      key: 'key-1',
      salt: null,
      shareLink: 'dynamic-link',
      includeFull: false,
      password: null,
    });
    updateDynamicLink.mockResolvedValue('new-data-id');
    const { generateShare } = useShare(dataManager);

    const link = await generateShare({ type: 'dynamic', includeFull: true, password: '', expiresInDays: 0 });

    expect(updateDynamicLink).toHaveBeenCalledTimes(1);
    expect(link).toBe('dynamic-link');
    expect(uiStore.dynamicShareMetadata.includeFull).toBe(true);
  });

  test('clears metadata and throws error when update fails', async () => {
    const uiStore = useUiStore();
    uiStore.setDynamicShareMetadata({
      pointerFileId: 'pointer-1',
      key: 'key-1',
      salt: null,
      shareLink: 'dynamic-link',
      includeFull: false,
      password: null,
    });
    updateDynamicLink.mockRejectedValue(new Error('network'));
    const { generateShare } = useShare(dataManager);

    await expect(generateShare({ type: 'dynamic', includeFull: false, password: '', expiresInDays: 0 })).rejects.toThrow(
      /動的共有リンクの更新に失敗しました/,
    );
    expect(uiStore.dynamicShareMetadata).toBeNull();
  });

  test('refreshDynamicShare shows toast and clears metadata on failure', async () => {
    const uiStore = useUiStore();
    uiStore.setDynamicShareMetadata({
      pointerFileId: 'pointer-1',
      key: 'key-1',
      salt: null,
      shareLink: 'dynamic-link',
      includeFull: false,
      password: null,
    });
    updateDynamicLink.mockRejectedValue(new Error('update failed'));
    const { refreshDynamicShare } = useShare(dataManager);

    const result = await refreshDynamicShare();

    expect(result).toBe(false);
    expect(showToastMock).toHaveBeenCalled();
    expect(uiStore.dynamicShareMetadata).toBeNull();
  });
});
