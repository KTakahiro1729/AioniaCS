import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

vi.mock('../../../src/libs/sabalessshare/src/index.js', () => ({
  createShareLink: vi.fn(async ({ uploadHandler }) => {
    await uploadHandler({ ciphertext: new ArrayBuffer(4), iv: new Uint8Array(12) });
    return 'link';
  }),
  createDynamicLink: vi.fn(),
}));

vi.mock('../../../src/libs/sabalessshare/src/crypto.js', async () => await import('../__mocks__/sabalessshare.js'));

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('rejects when Google Drive manager is missing', async () => {
    const { generateShare } = useShare({ googleDriveManager: null });
    await expect(generateShare({ type: 'snapshot', includeFull: true, password: '', expiresInDays: 0 })).rejects.toThrow(
      'サインインしてください',
    );
  });

  test('rejects when uploadAndShareFile returns null', async () => {
    const googleDriveManager = {
      uploadAndShareFile: vi.fn().mockResolvedValue(null),
      findOrCreateAioniaCSFolder: vi.fn().mockResolvedValue('folder-xyz'),
    };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ type: 'snapshot', includeFull: true, password: '', expiresInDays: 0 })).rejects.toThrow(
      'Google Drive へのアップロードに失敗しました',
    );
    expect(googleDriveManager.findOrCreateAioniaCSFolder).toHaveBeenCalled();
    expect(googleDriveManager.uploadAndShareFile).toHaveBeenCalledWith(
      expect.stringContaining('ciphertext'),
      'share.enc',
      'application/json',
      'folder-xyz',
    );
  });
});
