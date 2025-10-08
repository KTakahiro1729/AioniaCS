import { setActivePinia, createPinia } from 'pinia';
import { useShare } from '../../../src/composables/useShare.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

const showToast = vi.fn();

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast }),
}));

describe('useShare', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    showToast.mockClear();
  });

  test('throws when not signed in', async () => {
    const { generateShare } = useShare({ googleDriveManager: null }, vi.fn());
    await expect(generateShare()).rejects.toThrow('共有するにはサインインしてください');
  });

  test('returns null when save is cancelled', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const saveCharacterToDrive = vi.fn().mockResolvedValue(null);
    const googleDriveManager = { ensureFileIsShared: vi.fn() };
    const { generateShare } = useShare({ googleDriveManager }, saveCharacterToDrive);
    await expect(generateShare()).resolves.toBeNull();
    expect(saveCharacterToDrive).toHaveBeenCalledWith(false);
    expect(googleDriveManager.ensureFileIsShared).not.toHaveBeenCalled();
  });

  test('generates share link and ensures file is public', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    const saveCharacterToDrive = vi.fn().mockResolvedValue({ id: 'file-123' });
    const googleDriveManager = { ensureFileIsShared: vi.fn().mockResolvedValue('file-123') };
    const { generateShare } = useShare({ googleDriveManager }, saveCharacterToDrive);
    const link = await generateShare();
    expect(link).toContain('shareId=file-123');
    expect(googleDriveManager.ensureFileIsShared).toHaveBeenCalledWith('file-123');
  });

  test('copyLink shows success toast', async () => {
    navigator.clipboard = { writeText: vi.fn().mockResolvedValue() };
    const { copyLink } = useShare({ googleDriveManager: null }, vi.fn());
    await copyLink('link');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('link');
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast.mock.calls[0][0].type).toBe('success');
  });
});
