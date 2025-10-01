import { setActivePinia, createPinia } from 'pinia';
import { useAppModals } from '../../../src/composables/useAppModals.js';
import { useModal } from '../../../src/composables/useModal.js';
import { isDesktopDevice } from '../../../src/utils/device.js';

vi.mock('../../../src/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));
vi.mock('../../../src/utils/device.js', () => ({
  isDesktopDevice: vi.fn(),
}));

describe('useAppModals', () => {
  let showModalMock;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue(null);
    useModal.mockReturnValue({ showModal: showModalMock });
  });

  test('openHub wires sign events', async () => {
    const handleSignInClick = vi.fn();
    const handleSignOutClick = vi.fn();
    const { openHub } = useAppModals({
      dataManager: {},
      handleSignInClick,
      handleSignOutClick,
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet: vi.fn(),
      openPreviewPage: vi.fn(),
      copyEditCallback: vi.fn(),
    });
    await openHub();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on['sign-in']).toBe(handleSignInClick);
    expect(args.on['sign-out']).toBe(handleSignOutClick);
  });

  test('desktop uses direct print', async () => {
    isDesktopDevice.mockReturnValue(true);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals({
      dataManager: {},
      handleSignInClick: vi.fn(),
      handleSignOutClick: vi.fn(),
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet,
      openPreviewPage,
      copyEditCallback: vi.fn(),
    });
    await openIoModal();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on.print).toBe(printCharacterSheet);
  });

  test('mobile uses preview page', async () => {
    isDesktopDevice.mockReturnValue(false);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals({
      dataManager: {},
      handleSignInClick: vi.fn(),
      handleSignOutClick: vi.fn(),
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet,
      openPreviewPage,
      copyEditCallback: vi.fn(),
    });
    await openIoModal();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on.print).toBe(openPreviewPage);
  });
});
