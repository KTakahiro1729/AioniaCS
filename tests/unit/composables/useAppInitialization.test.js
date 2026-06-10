import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const initializeDriveManagerMock = vi.fn();
const isUsingMockDriveMock = vi.fn();

vi.mock('@/infrastructure/google-drive/index.js', () => ({
  initializeDriveManager: (...args) => initializeDriveManagerMock(...args),
  isUsingMockDrive: () => isUsingMockDriveMock(),
}));

const { useAppInitialization } = await import('@/app/providers/useAppInitialization.js');

describe('useAppInitialization', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test('sets loading state to false on initialize', async () => {
    initializeDriveManagerMock.mockReturnValue(null);
    isUsingMockDriveMock.mockReturnValue(false);
    const uiStore = useUiStore();
    uiStore.setLoading(true);
    const { initialize } = useAppInitialization();
    await initialize();
    expect(uiStore.isLoading).toBe(false);
  });

  test('marks drive as unavailable instead of falling back to mock when init fails', async () => {
    initializeDriveManagerMock.mockReturnValue({
      onGapiLoad: vi.fn().mockRejectedValue(new Error('gapi load failed')),
      restoreSession: vi.fn(),
    });
    isUsingMockDriveMock.mockReturnValue(false);
    const uiStore = useUiStore();
    const { initialize } = useAppInitialization();

    await initialize();

    // モックに切り替わって「サインイン済み」を装わないこと
    expect(uiStore.isGapiInitialized).toBe(false);
    expect(uiStore.isSignedIn).toBe(false);
    expect(uiStore.isLoading).toBe(false);
  });

  test('keeps mock drive available when explicitly enabled and init fails', async () => {
    initializeDriveManagerMock.mockReturnValue({
      onGapiLoad: vi.fn().mockRejectedValue(new Error('mock init failed')),
      restoreSession: vi.fn(),
    });
    isUsingMockDriveMock.mockReturnValue(true);
    const uiStore = useUiStore();
    const { initialize } = useAppInitialization();

    await initialize();

    expect(uiStore.isGapiInitialized).toBe(true);
    expect(uiStore.isSignedIn).toBe(true);
  });
});
