import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

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

describe('useGoogleDrive', () => {
  let showModalMock;

  beforeEach(() => {
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue({ value: 'overwrite' });
    useModal.mockReturnValue({ showModal: showModalMock });
  });

  test('saveCharacterToDrive updates an existing file when current id is set', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.json' }),
      findDriveFileByCharacterName: vi.fn(),
      googleDriveManager: {},
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
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
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
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
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
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
      getDriveFileName: vi.fn().mockReturnValue('Explorer.json'),
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
      getDriveFileName: vi.fn().mockReturnValue('Hero.json'),
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
    uiStore.isGisInitialized = true;
    uiStore.setCurrentDriveFileId('existing-id');

    const result = await saveCharacterToDrive();

    expect(renameFile).toHaveBeenCalledWith('existing-id', 'Knight.zip');
    expect(result).toEqual({ id: 'existing-id', name: 'Knight.zip' });
  });
});
