import { setActivePinia, createPinia } from 'pinia';
import { useAppInitialization } from '../../../src/composables/useAppInitialization.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';
import { buildCharacterArchive } from '../../../src/utils/characterSerialization.js';

const showToast = vi.fn();

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast }),
}));

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    showToast.mockClear();
    delete global.fetch;
  });

  test('loads shared data when shareId exists', async () => {
    const payload = {
      character: { name: 'Shared' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const archive = await buildCharacterArchive({ data: payload });
    const buffer = archive.content.buffer.slice(archive.content.byteOffset, archive.content.byteOffset + archive.content.byteLength);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
    const dataManager = { parseLoadedData: vi.fn((data) => data) };
    const { initialize } = useAppInitialization(dataManager);

    const originalLocation = window.location.href;
    window.history.replaceState({}, '', `${window.location.pathname}?shareId=test-file`);
    await initialize();
    window.history.replaceState({}, '', originalLocation);

    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    expect(global.fetch).toHaveBeenCalled();
    expect(dataManager.parseLoadedData).toHaveBeenCalled();
    expect(uiStore.isViewingShared).toBe(true);
    expect(charStore.character.name).toBe('Shared');
  });

  test('does nothing when shareId is absent', async () => {
    global.fetch = vi.fn();
    const dataManager = { parseLoadedData: vi.fn((data) => data) };
    const { initialize } = useAppInitialization(dataManager);

    const originalLocation = window.location.href;
    window.history.replaceState({}, '', window.location.pathname);
    await initialize();
    window.history.replaceState({}, '', originalLocation);

    expect(global.fetch).not.toHaveBeenCalled();
    const uiStore = useUiStore();
    expect(uiStore.isViewingShared).toBe(false);
  });

  test('shows error toast when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    const dataManager = { parseLoadedData: vi.fn() };
    const { initialize } = useAppInitialization(dataManager);

    const originalLocation = window.location.href;
    window.history.replaceState({}, '', `${window.location.pathname}?shareId=missing`);
    await initialize();
    window.history.replaceState({}, '', originalLocation);

    expect(showToast).toHaveBeenCalled();
  });

  test('updates loading state around fetch', async () => {
    const payload = {
      character: { name: 'Delayed' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const archive = await buildCharacterArchive({ data: payload });
    const buffer = archive.content.buffer.slice(archive.content.byteOffset, archive.content.byteOffset + archive.content.byteLength);
    let resolveArrayBuffer;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () =>
        new Promise((r) => {
          resolveArrayBuffer = () => r(buffer);
        }),
    });
    const dataManager = { parseLoadedData: vi.fn((data) => data) };
    const { initialize } = useAppInitialization(dataManager);

    const originalLocation = window.location.href;
    window.history.replaceState({}, '', `${window.location.pathname}?shareId=delay`);
    const initPromise = initialize();
    await vi.waitFor(() => expect(typeof resolveArrayBuffer).toBe('function'));
    const uiStore = useUiStore();
    expect(uiStore.isLoading).toBe(true);
    resolveArrayBuffer();
    await initPromise;
    window.history.replaceState({}, '', originalLocation);
    expect(uiStore.isLoading).toBe(false);
  });
});
