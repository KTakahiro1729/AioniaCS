import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { buildSnapshotFromStore } from '@/features/character-sheet/utils/characterSnapshot.js';
import { messages } from '@/i18n/index.js';

const showToastMock = vi.fn();
const showAsyncToastMock = vi.fn();
const logAndToastErrorMock = vi.fn();

vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    showToast: showToastMock,
    showAsyncToast: showAsyncToastMock,
    logAndToastError: logAndToastErrorMock,
  }),
}));

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test('saveCharacterToDrive updates an existing file when current id is set', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.json' }),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    charStore.character.name = 'Hero';
    uiStore.setCurrentDriveFileId('existing-id');

    await saveCharacterToDrive();

    expect(dataManager.saveCharacterToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      'existing-id',
    );
    expect(uiStore.lastSavedSnapshot).toBe(buildSnapshotFromStore(charStore));
  });

  test('loadCharacterFromDrive loads data and updates store', async () => {
    const loadData = {
      character: { name: 'Explorer' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue(loadData),
      parseLoadedData: vi.fn(),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Explorer.json'),
    };
    const { loadCharacterFromDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    uiStore.setCurrentDriveFileId('file-1');

    const result = await loadCharacterFromDrive('file-1');

    expect(result).toEqual(loadData);
    expect(charStore.character.name).toBe('Explorer');
    expect(uiStore.currentDriveFileId).toBe('file-1');
    expect(uiStore.lastSavedSnapshot).toBe(buildSnapshotFromStore(charStore));
  });

  test('loadCharacterFromDrive uses provided display name in toast messages', async () => {
    const loadData = {
      character: { name: 'Explorer' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue(loadData),
      parseLoadedData: vi.fn(),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Explorer.json'),
    };
    const { loadCharacterFromDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;

    await loadCharacterFromDrive('file-display', null, 'Display Name');

    const toastOptions = showAsyncToastMock.mock.calls[showAsyncToastMock.mock.calls.length - 1][1];
    expect(toastOptions.loading).toEqual(messages.googleDrive.load.loading('Display Name'));
    expect(toastOptions.success).toEqual(messages.googleDrive.load.success('Display Name'));
  });

  test('loadCharacterFromDrive falls back to character name when display name is missing', async () => {
    const initialData = {
      character: { name: 'Fallback Name' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn(),
      parseLoadedData: vi.fn().mockReturnValue(initialData),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Fallback.json'),
    };
    const { loadCharacterFromDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;

    await loadCharacterFromDrive('file-fallback', initialData);

    const toastOptions = showAsyncToastMock.mock.calls[showAsyncToastMock.mock.calls.length - 1][1];
    expect(toastOptions.loading).toEqual(messages.googleDrive.load.loading('Fallback Name'));
  });

  test('loadCharacterFromDrive uses initial data without downloading', async () => {
    const initialData = {
      character: { name: 'Prefetched' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    const normalized = { ...initialData, character: { name: 'Normalized Prefetched' } };
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn(),
      parseLoadedData: vi.fn().mockReturnValue(normalized),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Prefetched.json'),
    };
    const { loadCharacterFromDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;

    const result = await loadCharacterFromDrive('file-prefetch', initialData);

    expect(dataManager.loadDataFromDrive).not.toHaveBeenCalled();
    expect(dataManager.parseLoadedData).toHaveBeenCalledWith(initialData);
    expect(result).toEqual(normalized);
    expect(charStore.character.name).toBe('Normalized Prefetched');
  });

  test('saveCharacterToDrive renames file when saved name differs from character name', async () => {
    const renameFile = vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Knight.zip' });
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.zip' }),
      findDriveFileByCharacterName: vi.fn(),
      googleDriveManager: { renameFile },
      getDriveFileName: vi.fn().mockReturnValue('Knight.zip'),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    charStore.character.name = 'Knight';
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    uiStore.setCurrentDriveFileId('existing-id');

    const result = await saveCharacterToDrive();

    expect(renameFile).toHaveBeenCalledWith('existing-id', 'Knight.zip');
    expect(result).toEqual({ id: 'existing-id', name: 'Knight.zip' });
  });

  test('saveCharacterToDrive treats a null result as failure instead of success', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue(null),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Hero.zip'),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;

    const result = await saveCharacterToDrive();

    expect(result).toBeNull();
    expect(uiStore.currentDriveFileId).toBeNull();
    expect(uiStore.lastSavedSnapshot).toBeNull();
    // showAsyncToastに渡されたPromiseはrejectし、エラートーストが表示される
    const toastPromise = showAsyncToastMock.mock.calls[showAsyncToastMock.mock.calls.length - 1][0];
    await expect(toastPromise).rejects.toThrow(messages.googleDrive.save.error().message);
  });

  test('saveCharacterToDrive uses new success message for brand-new files', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'new-id', name: 'Rookie.zip' }),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Rookie.zip'),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;
    uiStore.isSignedIn = true;

    await saveCharacterToDrive(true);

    expect(showAsyncToastMock).toHaveBeenCalled();
    const toastOptions = showAsyncToastMock.mock.calls[showAsyncToastMock.mock.calls.length - 1][1];
    expect(toastOptions.loading).toEqual(messages.googleDrive.save.newLoading());
    expect(toastOptions.success).toEqual(messages.googleDrive.save.newSuccess());
  });

  test('saveCharacterToDrive keeps default success message when updating existing files', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Veteran.zip' }),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Veteran.zip'),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;
    uiStore.isSignedIn = true;
    uiStore.setCurrentDriveFileId('existing-id');

    await saveCharacterToDrive(false);

    expect(showAsyncToastMock).toHaveBeenCalled();
    const toastOptions = showAsyncToastMock.mock.calls[showAsyncToastMock.mock.calls.length - 1][1];
    expect(toastOptions.loading).toEqual(messages.googleDrive.save.loading());
    expect(toastOptions.success).toEqual(messages.googleDrive.save.success());
  });
});
