import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useAppModals } from '@/features/modals/composables/useAppModals.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import { isDesktopDevice } from '@/shared/utils/device.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));
vi.mock('@/shared/utils/device.js', () => ({
  isDesktopDevice: vi.fn(),
}));
vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: vi.fn(),
}));
vi.mock('@/features/cloud-sync/composables/useShare.js', () => ({
  useShare: vi.fn(),
}));

describe('useAppModals', () => {
  let showModalMock;
  let showToastMock;
  let showAsyncToastMock;
  let logAndToastErrorMock;
  let clipboardWriteMock;
  let createShareLinkMock;

  function createOptions(overrides = {}) {
    return {
      dataManager: {},
      handleSignInClick: vi.fn(),
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet: vi.fn(),
      openPreviewPage: vi.fn(),
      copyEditCallback: vi.fn(),
      loadCharacterFromDrive: vi.fn(),
      promptForDriveFolder: vi.fn(),
      updateDriveFolderPath: vi.fn(),
      canSignInToGoogle: ref(true),
      isDriveReady: ref(true),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue(null);
    useModal.mockReturnValue({ showModal: showModalMock });
    showToastMock = vi.fn();
    showAsyncToastMock = vi.fn();
    logAndToastErrorMock = vi.fn();
    useNotifications.mockReturnValue({
      showToast: showToastMock,
      showAsyncToast: showAsyncToastMock,
      logAndToastError: logAndToastErrorMock,
    });
    createShareLinkMock = vi.fn().mockResolvedValue('https://example.com');
    useShare.mockReturnValue({ createShareLink: createShareLinkMock });
    clipboardWriteMock = vi.fn().mockResolvedValue();
    global.navigator = { clipboard: { writeText: clipboardWriteMock } };
  });

  test('openLoadModal wires sign in event', async () => {
    const handleSignInClick = vi.fn();
    const opts = createOptions({ handleSignInClick });
    const { openLoadModal } = useAppModals(opts);
    await openLoadModal();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on['sign-in']).toBe(handleSignInClick);
    expect(args.on['load-local']).toBe(opts.handleFileUpload);
  });

  test('desktop uses direct print', async () => {
    isDesktopDevice.mockReturnValue(true);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals(createOptions({ printCharacterSheet, openPreviewPage }));
    await openIoModal();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on.print).toBe(printCharacterSheet);
  });

  test('mobile uses preview page', async () => {
    isDesktopDevice.mockReturnValue(false);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals(createOptions({ printCharacterSheet, openPreviewPage }));
    await openIoModal();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on.print).toBe(openPreviewPage);
  });

  test('chat palette output copies text', async () => {
    const { openIoModal } = useAppModals(createOptions());
    await openIoModal();
    const args = showModalMock.mock.calls[0][0];
    await args.on['output-chat-palette']();
    expect(clipboardWriteMock).toHaveBeenCalledWith('チャットパレット\nチャットパレット2');
    expect(showToastMock).toHaveBeenCalled();
  });

  test('openShareModal uses async toast when signed in', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const { openShareModal } = useAppModals(createOptions());
    await openShareModal();
    expect(createShareLinkMock).toHaveBeenCalled();
    expect(showAsyncToastMock).toHaveBeenCalled();
    expect(clipboardWriteMock).toHaveBeenCalledWith('https://example.com');
  });

  test('openShareModal warns when signed out', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = false;
    const { openShareModal } = useAppModals(createOptions());
    await openShareModal();
    expect(showToastMock).toHaveBeenCalled();
    expect(showAsyncToastMock).not.toHaveBeenCalled();
  });

  test('openShareModal uses copy edit callback for shared view', async () => {
    const uiStore = useUiStore();
    uiStore.isViewingShared = true;
    const copyEditCallback = vi.fn();
    const { openShareModal } = useAppModals(createOptions({ copyEditCallback }));
    await openShareModal();
    expect(copyEditCallback).toHaveBeenCalled();
    expect(showAsyncToastMock).not.toHaveBeenCalled();
  });
});
