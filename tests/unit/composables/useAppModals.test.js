import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';
import { useAppModals } from '../../../src/composables/useAppModals.js';
import { useModal } from '../../../src/composables/useModal.js';

vi.mock('../../../src/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));

describe('useAppModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    useModal.mockReturnValue({ showModal: vi.fn().mockResolvedValue(null) });
  });

  test('openIoModal wires drive handlers', async () => {
    const handleSignInClick = vi.fn();
    const handleSignOutClick = vi.fn();
    const openDriveFile = vi.fn();
    const saveAsNewFile = vi.fn();
    const overwriteFile = vi.fn();

    const { openIoModal } = useAppModals({
      dataManager: {},
      loadCharacterById: vi.fn(),
      saveFile: vi.fn(),
      handleSignInClick,
      handleSignOutClick,
      refreshHubList: vi.fn(),
      saveNewCharacter: vi.fn(),
      openDriveFile,
      saveAsNewFile,
      overwriteFile,
      canOverwrite: () => true,
      copyEditCallback: vi.fn(),
    });

    await openIoModal();
    const args = useModal.mock.results[0].value.showModal.mock.calls[0][0];

    expect(args.on.login).toBe(handleSignInClick);
    expect(args.on.logout).toBe(handleSignOutClick);
    expect(args.on.open).toBe(openDriveFile);
    expect(args.on['save-new']).toBe(saveAsNewFile);
    expect(args.on.overwrite).toBe(overwriteFile);
  });
});
