import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';

const { shareLinkCalls, dynamicLinkCalls, createShareLinkMock, createDynamicLinkMock } = vi.hoisted(() => {
  const shareCalls = [];
  const dynamicCalls = [];
  const shareMock = vi.fn(async (options) => {
    shareCalls.push(options);
    if (typeof options.uploadHandler === 'function') {
      await options.uploadHandler({ ciphertext: new ArrayBuffer(4), iv: new Uint8Array(12) });
    }
    return 'link';
  });
  const dynamicMock = vi.fn(async (options) => {
    dynamicCalls.push(options);
    return { shareLink: 'dynamic-link' };
  });
  return { shareLinkCalls: shareCalls, dynamicLinkCalls: dynamicCalls, createShareLinkMock: shareMock, createDynamicLinkMock: dynamicMock };
});

vi.mock('../../../src/libs/sabalessshare/src/index.js', () => ({
  createShareLink: createShareLinkMock,
}));

vi.mock('../../../src/libs/sabalessshare/src/dynamic.js', () => ({
  createDynamicLink: createDynamicLinkMock,
}));

vi.mock('../../../src/libs/sabalessshare/src/crypto.js', async () => await import('../__mocks__/sabalessshare.js'));

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn() }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    shareLinkCalls.length = 0;
    dynamicLinkCalls.length = 0;
    const store = useCharacterStore();
    store.character = { name: 'Hero', images: [] };
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
    const googleDriveManager = { uploadAndShareFile: vi.fn().mockResolvedValue(null) };
    const { generateShare } = useShare({ googleDriveManager });
    await expect(generateShare({ type: 'snapshot', includeFull: true, password: '', expiresInDays: 0 })).rejects.toThrow(
      'Google Drive へのアップロードに失敗しました',
    );
  });

  test('includes images in cloud share payload when includeFull is true', async () => {
    const store = useCharacterStore();
    const images = ['data:image/png;base64,AAA', 'data:image/jpeg;base64,BBB'];
    store.character = { name: 'Hero', images };

    const googleDriveManager = { uploadAndShareFile: vi.fn().mockResolvedValue('file-id') };
    const { generateShare } = useShare({ googleDriveManager });

    const result = await generateShare({ type: 'snapshot', includeFull: true, password: '', expiresInDays: 0 });
    expect(result).toBe('link');
    expect(createShareLinkMock).toHaveBeenCalledTimes(1);
    expect(shareLinkCalls).toHaveLength(1);

    const [{ data }] = shareLinkCalls;
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(data)));
    expect(payload.character.images).toEqual(images);
    expect(payload.skills).toEqual([]);
  });

  test('includes images in dynamic share payload when includeFull is true', async () => {
    const store = useCharacterStore();
    const images = ['data:image/png;base64,CCC'];
    store.character = { name: 'Hero', images };

    const googleDriveManager = {
      uploadAndShareFile: vi.fn().mockResolvedValueOnce('data-file').mockResolvedValueOnce('pointer-file'),
    };
    const { generateShare } = useShare({ googleDriveManager });

    const result = await generateShare({ type: 'dynamic', includeFull: true, password: '', expiresInDays: 0 });
    expect(result).toBe('dynamic-link');
    expect(createDynamicLinkMock).toHaveBeenCalledTimes(1);
    expect(dynamicLinkCalls).toHaveLength(1);

    const [{ data }] = dynamicLinkCalls;
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(data)));
    expect(payload.character.images).toEqual(images);
    expect(payload.skills).toEqual([]);
  });
});
