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

function createDriveManagerStub(normalizedPath = '慈悲なきアイオニア/PC/第一キャンペーン') {
  const showFolderPicker = vi.fn();
  const setCharacterFolderPath = vi.fn().mockResolvedValue(normalizedPath);
  const findOrCreateConfiguredCharacterFolder = vi.fn().mockResolvedValue('folder-id');
  const normalizeFolderPath = vi.fn((path) => path.replace(/\\/g, '/'));

  return {
    showFolderPicker,
    setCharacterFolderPath,
    findOrCreateConfiguredCharacterFolder,
    normalizeFolderPath,
  };
}

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({ folder_path: '慈悲なきアイオニア', folder_id: null, folder_name: null }) }),
    );
    if (typeof document !== 'undefined') {
      document.requestStorageAccess = undefined;
    }
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
    document.requestStorageAccess = vi.fn().mockResolvedValue();

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
      googleDriveManager: {
        getCachedAccessToken: vi.fn().mockReturnValue('picker-token'),
        showFilePickerSync: vi.fn((cb, token, parentId) => cb(null, { id: 'file-1', name: 'Explorer.json', parentId, token })),
        findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-id'),
        loadConfig: vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア', folderId: 'folder-id' }),
      },
      getDriveFileName: vi.fn().mockReturnValue('Explorer.json'),
    };
    const { loadCharacterFromDrive, refreshDriveFolderPath, isDriveTokenWarm } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    isDriveTokenWarm.value = true;
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        folder_path: '慈悲なきアイオニア',
        folder_id: 'folder-id',
        folder_name: '慈悲なきアイオニア',
      }),
    });

    await refreshDriveFolderPath();
    const result = await loadCharacterFromDrive();

    expect(document.requestStorageAccess).toHaveBeenCalledTimes(1);
    expect(result).toEqual(loadData);
    expect(charStore.character.name).toBe('Explorer');
    expect(uiStore.currentDriveFileId).toBe('file-1');
    expect(uiStore.lastSavedSnapshot).toBe(buildSnapshotFromStore(charStore));
    expect(dataManager.googleDriveManager.showFilePickerSync).toHaveBeenCalledWith(expect.any(Function), 'picker-token', 'folder-id', [
      'application/json',
      'application/zip',
    ]);
  });

  test('loadCharacterFromDrive triggers picker synchronously when token is warm', async () => {
    const showFilePickerSync = vi.fn((cb) => cb(null, { id: 'file-sync', name: 'Sync.json' }));
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue({
        character: { name: 'Sync' },
        skills: [],
        specialSkills: [],
        equipments: {},
        histories: [],
      }),
      googleDriveManager: {
        getCachedAccessToken: vi.fn().mockReturnValue('sync-token'),
        showFilePickerSync,
      },
      getDriveFileName: vi.fn().mockReturnValue('Sync.json'),
    };
    const { loadCharacterFromDrive, isDriveTokenWarm } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    isDriveTokenWarm.value = true;

    const promise = loadCharacterFromDrive();
    expect(showFilePickerSync).toHaveBeenCalledTimes(1);
    await promise;
  });

  test('loadCharacterFromDrive shows toast when storage access request fails', async () => {
    const accessError = new Error('denied');
    document.requestStorageAccess = vi.fn(() => Promise.reject(accessError));

    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      loadDataFromDrive: vi.fn(),
      googleDriveManager: {
        getCachedAccessToken: vi.fn().mockReturnValue('picker-token'),
        showFilePickerSync: vi.fn(),
      },
      getDriveFileName: vi.fn(),
    };
    const { loadCharacterFromDrive, isDriveTokenWarm } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isSignedIn = true;
    isDriveTokenWarm.value = true;

    const result = await loadCharacterFromDrive();

    expect(result).toBeNull();
    expect(logAndToastErrorMock).toHaveBeenCalledWith(accessError, expect.anything(), 'loadCharacterFromDrive');
    expect(dataManager.googleDriveManager.showFilePickerSync).not.toHaveBeenCalled();
  });

  test('promptForDriveFolder applies picker selection to drive path', async () => {
    const desiredPath = '慈悲なきアイオニア/PC/第一キャンペーン';
    const stubManager = createDriveManagerStub(desiredPath);
    stubManager.showFolderPicker.mockImplementation((cb) => cb(null, { id: 'folder-1', name: '第一キャンペーン', path: desiredPath }));

    const dataManager = {
      googleDriveManager: stubManager,
      setGoogleDriveManager(manager) {
        Object.assign(manager, stubManager);
        this.googleDriveManager = manager;
      },
      loadDataFromDrive: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
    };

    const { promptForDriveFolder } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.isGapiInitialized = true;
    uiStore.setDriveFolderPath('慈悲なきアイオニア');

    const selected = await promptForDriveFolder();

    expect(stubManager.showFolderPicker).toHaveBeenCalled();
    expect(stubManager.setCharacterFolderPath).toHaveBeenCalledWith(desiredPath);
    expect(uiStore.driveFolderPath).toBe(desiredPath);
    expect(selected).toBe(desiredPath);
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
