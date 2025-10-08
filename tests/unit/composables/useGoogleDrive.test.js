import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';

vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));
vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: vi.fn(() => ({
    showToast: vi.fn(),
    showAsyncToast: vi.fn((promise) => promise),
  })),
}));

import { useModal } from '@/features/modals/composables/useModal.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';

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

async function flushDriveEffects() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
}

describe('useGoogleDrive', () => {
  let showModalMock;

  beforeEach(() => {
    resetGoogleDriveManagerForTests();
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue({ value: 'overwrite' });
    useModal.mockReturnValue({ showModal: showModalMock });
    useNotifications.mockReturnValue({
      showToast: vi.fn(),
      showAsyncToast: vi.fn((promise) => promise.catch(() => {})),
    });
  });

  test('saveCharacterToDrive updates an existing file when current id is set', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.json' }),
      findDriveFileByCharacterName: vi.fn(),
      googleDriveManager: {},
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;
    charStore.character.name = 'Hero';
    uiStore.setCurrentDriveFileId('existing-id');

    await saveCharacterToDrive();

    expect(dataManager.findDriveFileByCharacterName).not.toHaveBeenCalled();
    expect(dataManager.saveCharacterToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      'existing-id',
    );
  });

  test('saveCharacterToDrive prompts for overwrite when duplicate exists', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'dup-id', name: 'Hero.json' }),
      findDriveFileByCharacterName: vi.fn().mockResolvedValue({ id: 'dup-id', name: 'Hero.json' }),
      googleDriveManager: {},
    };
    showModalMock.mockResolvedValue({ value: 'overwrite' });
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;
    charStore.character.name = 'Hero';
    uiStore.clearCurrentDriveFileId();

    await saveCharacterToDrive(true);

    expect(dataManager.findDriveFileByCharacterName).toHaveBeenCalledWith('Hero');
    expect(showModalMock).toHaveBeenCalled();
    expect(dataManager.saveCharacterToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      'dup-id',
    );
  });

  test('saveCharacterToDrive cancels when overwrite declined', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      findDriveFileByCharacterName: vi.fn().mockResolvedValue({ id: 'dup-id', name: 'Hero.json' }),
      googleDriveManager: {},
    };
    showModalMock.mockResolvedValue({ value: 'cancel' });
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Hero';
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;

    const result = await saveCharacterToDrive(true);

    expect(result).toBeNull();
    expect(dataManager.saveCharacterToDrive).not.toHaveBeenCalled();
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
      findDriveFileByCharacterName: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue(loadData),
      googleDriveManager: {
        showFilePicker: (cb) => cb(null, { id: 'file-1', name: 'Explorer.json' }),
        findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-id'),
      },
    };
    const { loadCharacterFromDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;

    const result = await loadCharacterFromDrive();

    expect(result).toEqual(loadData);
    expect(charStore.character.name).toBe('Explorer');
    expect(uiStore.currentDriveFileId).toBe('file-1');
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
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
    };

    const { promptForDriveFolder } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;
    uiStore.setDriveFolderPath('慈悲なきアイオニア');

    const selected = await promptForDriveFolder();

    expect(stubManager.showFolderPicker).toHaveBeenCalled();
    expect(stubManager.setCharacterFolderPath).toHaveBeenCalledWith(desiredPath);
    expect(uiStore.driveFolderPath).toBe(desiredPath);
    expect(selected).toBe(desiredPath);
  });

  test('handleSignInClick resolves and refreshes config on success', async () => {
    const loadConfig = vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア' });
    const handleSignIn = vi.fn((cb) => {
      const uiStore = useUiStore();
      uiStore.isSignedIn = true;
      cb(null, { signedIn: true });
    });
    const dataManager = {
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      googleDriveManager: {},
      setGoogleDriveManager(manager) {
        Object.assign(manager, { loadConfig, handleSignIn });
        this.googleDriveManager = manager;
      },
    };

    const { handleSignInClick } = useGoogleDrive(dataManager);
    handleSignInClick();

    await flushDriveEffects();

    expect(handleSignIn).toHaveBeenCalled();
    expect(loadConfig).toHaveBeenCalled();
  });

  test('handleSignInClick surfaces errors from manager', async () => {
    const error = new Error('One Tap canceled');
    const handleSignIn = vi.fn((cb) => cb(error));
    const dataManager = {
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      googleDriveManager: {},
      setGoogleDriveManager(manager) {
        Object.assign(manager, { handleSignIn });
        this.googleDriveManager = manager;
      },
    };

    const { handleSignInClick } = useGoogleDrive(dataManager);
    handleSignIn.mockClear();

    handleSignInClick();

    await flushDriveEffects();

    expect(handleSignIn).toHaveBeenCalled();
    expect(useUiStore().isSignedIn).toBe(false);
  });

  test('drive folder refreshes when uiStore becomes signed in', async () => {
    const loadConfig = vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア/PC' });
    const managerStub = {
      loadConfig,
      attachUiStore: vi.fn(),
    };
    const dataManager = {
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      googleDriveManager: {},
      setGoogleDriveManager(manager) {
        Object.assign(manager, managerStub);
        this.googleDriveManager = manager;
      },
    };

    useGoogleDrive(dataManager);
    const uiStore = useUiStore();

    uiStore.isSignedIn = true;
    await flushDriveEffects();

    expect(loadConfig).toHaveBeenCalled();
    expect(uiStore.driveFolderPath).toBe('慈悲なきアイオニア/PC');
  });
});
