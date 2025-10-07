import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

vi.mock('../../../src/libs/sabalessshare/src/index.js', () => ({
  createShareLink: vi.fn(async ({ uploadHandler }) => {
    await uploadHandler({ ciphertext: new ArrayBuffer(4), iv: new Uint8Array(12) });
    return 'link';
  }),
}));

vi.mock('../../../src/libs/sabalessshare/src/dynamic.js', () => ({
  createDynamicLink: vi.fn(async () => ({ shareLink: 'dynamic-link' })),
}));

vi.mock('../../../src/libs/sabalessshare/src/crypto.js', async () => await import('../__mocks__/sabalessshare.js'));

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../../src/utils/characterSerialization.js', () => ({
  serializeCharacterForExport: vi.fn(() => ({
    data: {
      character: { name: 'Hero' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    },
    images: [],
  })),
  buildCharacterArchive: vi.fn(async () => ({
    content: new Uint8Array([1, 2, 3]),
    mimeType: 'application/zip',
  })),
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
    await expect(generateShare({ type: 'snapshot', password: '', expiresInDays: 0 })).rejects.toThrow('サインインしてください');
  });

  test('rejects when uploadAndShareFile returns null', async () => {
    const googleDriveManager = { uploadAndShareFile: vi.fn().mockResolvedValue(null) };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ type: 'snapshot', password: '', expiresInDays: 0 })).rejects.toThrow(
      'Google Drive へのアップロードに失敗しました',
    );
  });

  test('generates snapshot share link using cloud mode', async () => {
    const googleDriveManager = { uploadAndShareFile: vi.fn().mockResolvedValue('file-id') };
    const { generateShare } = useShare({ googleDriveManager });
    const link = await generateShare({ type: 'snapshot', password: '', expiresInDays: 0 });
    expect(link).toBe('link');
    const { createShareLink } = await import('../../../src/libs/sabalessshare/src/index.js');
    expect(createShareLink).toHaveBeenCalledWith(expect.objectContaining({ mode: 'cloud', expiresInDays: 0 }));
  });

  test('generates dynamic share link when selected', async () => {
    const googleDriveManager = { uploadAndShareFile: vi.fn().mockResolvedValue('file-id') };
    const { generateShare } = useShare({ googleDriveManager });
    const link = await generateShare({ type: 'dynamic', password: '', expiresInDays: 7 });
    expect(link).toBe('dynamic-link');
    const { createDynamicLink } = await import('../../../src/libs/sabalessshare/src/dynamic.js');
    expect(createDynamicLink).toHaveBeenCalledWith(expect.objectContaining({ expiresInDays: 7, password: undefined }));
  });
});
