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
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useModal.mockReturnValue({ showModal: vi.fn().mockResolvedValue(null) });
  });

  test('desktop uses direct print', async () => {
    isDesktopDevice.mockReturnValue(true);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals({
      dataManager: {},
      loadCharacterById: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      saveNewDriveCharacter: vi.fn(),
      openDriveFile: vi.fn(),
      handleSignInClick: vi.fn(),
      handleSignOutClick: vi.fn(),
      refreshHubList: vi.fn(),
      saveNewCharacter: vi.fn(),
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet,
      openPreviewPage,
      copyEditCallback: vi.fn(),
    });
    await openIoModal();
    const args = useModal.mock.results[0].value.showModal.mock.calls[0][0];
    expect(args.on.print).toBe(printCharacterSheet);
  });

  test('mobile uses preview page', async () => {
    isDesktopDevice.mockReturnValue(false);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals({
      dataManager: {},
      loadCharacterById: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      saveNewDriveCharacter: vi.fn(),
      openDriveFile: vi.fn(),
      handleSignInClick: vi.fn(),
      handleSignOutClick: vi.fn(),
      refreshHubList: vi.fn(),
      saveNewCharacter: vi.fn(),
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet,
      openPreviewPage,
      copyEditCallback: vi.fn(),
    });
    await openIoModal();
    const args = useModal.mock.results[0].value.showModal.mock.calls[0][0];
    expect(args.on.print).toBe(openPreviewPage);
  });
});
