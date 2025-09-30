import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '../../../src/composables/useGoogleDrive.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));

import { useModal } from '../../../src/composables/useModal.js';

describe('useGoogleDrive', () => {
  let showModalMock;

  beforeEach(() => {
    setActivePinia(createPinia());
    showModalMock = vi.fn().mockResolvedValue({ value: 'overwrite' });
    useModal.mockReturnValue({ showModal: showModalMock });
  });

  test('saveCharacterToDrive updates an existing file when current id is set', async () => {
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.json' }),
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
    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
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
      saveDataToAppData: vi.fn().mockResolvedValue({ id: 'dup-id', name: 'Hero.json' }),
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
    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
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
      saveDataToAppData: vi.fn(),
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
    expect(dataManager.saveDataToAppData).not.toHaveBeenCalled();
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
      saveDataToAppData: vi.fn(),
      findDriveFileByCharacterName: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue(loadData),
      googleDriveManager: {
        showFilePicker: (cb) => cb(null, { id: 'file-1', name: 'Explorer.json' }),
        findOrCreateAioniaCSFolder: vi.fn().mockResolvedValue('folder-id'),
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
});
