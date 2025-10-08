import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { resetGoogleDriveManagerForTests } from '@/infrastructure/google-drive/googleDriveManager.js';

vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));

import { useModal } from '@/features/modals/composables/useModal.js';

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
    localStorage.clear();
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue({ value: 'overwrite' });
    useModal.mockReturnValue({ showModal: showModalMock });
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

  test('handleSignInClick stores auto sign-in flag without affecting manual flow', async () => {
    const loadConfig = vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア' });
    const handleSignIn = vi.fn((cb) => cb(null, { signedIn: true }));
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

    await Promise.resolve();

    expect(handleSignIn).toHaveBeenCalled();
    expect(localStorage.getItem('aionia:drive:autoSignIn')).toBe('1');
  });

  test('restoreDriveSession auto signs in when drive becomes ready', async () => {
    localStorage.setItem('aionia:drive:autoSignIn', '1');
    const restoreDriveSession = vi.fn().mockResolvedValue({ signedIn: true });
    const loadConfig = vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア/PC' });
    const dataManager = {
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      googleDriveManager: {},
      setGoogleDriveManager(manager) {
        Object.assign(manager, { restoreDriveSession, loadConfig });
        this.googleDriveManager = manager;
      },
    };

    useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;

    await flushDriveEffects();

    expect(restoreDriveSession).toHaveBeenCalled();
    expect(uiStore.isSignedIn).toBe(true);
    expect(loadConfig).toHaveBeenCalled();
    expect(localStorage.getItem('aionia:drive:autoSignIn')).toBe('1');
  });

  test('failed restoreDriveSession clears auto sign-in flag', async () => {
    localStorage.setItem('aionia:drive:autoSignIn', '1');
    const restoreDriveSession = vi.fn().mockRejectedValue(new Error('no token'));
    const dataManager = {
      findDriveFileByCharacterName: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      googleDriveManager: {},
      setGoogleDriveManager(manager) {
        Object.assign(manager, { restoreDriveSession });
        this.googleDriveManager = manager;
      },
    };

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;

    await flushDriveEffects();

    expect(restoreDriveSession).toHaveBeenCalled();
    expect(uiStore.isSignedIn).toBe(false);
    expect(localStorage.getItem('aionia:drive:autoSignIn')).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});
