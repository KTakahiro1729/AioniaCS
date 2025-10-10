import { setActivePinia, createPinia } from 'pinia';
import { useAppModals } from '@/features/modals/composables/useAppModals.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import { isDesktopDevice } from '@/shared/utils/device.js';

vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));
vi.mock('@/shared/utils/device.js', () => ({
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

  test('openHub opens without auth event wiring', async () => {
    const { openHub } = useAppModals({
      dataManager: {},
      saveData: vi.fn(),
      handleFileUpload: vi.fn(),
      outputToCocofolia: vi.fn(),
      printCharacterSheet: vi.fn(),
      openPreviewPage: vi.fn(),
      copyEditCallback: vi.fn(),
    });
    await openHub();
    const args = showModalMock.mock.calls[0][0];
    expect(args.on).toBeUndefined();
  });

  test('desktop uses direct print', async () => {
    isDesktopDevice.mockReturnValue(true);
    const printCharacterSheet = vi.fn();
    const openPreviewPage = vi.fn();
    const { openIoModal } = useAppModals({
      dataManager: {},
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
