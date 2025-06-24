import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '../../../src/composables/useGoogleDrive.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('handleSaveToDriveClick calls saveDataToAppData with store data', async () => {
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ fileId: '1' }),
      googleDriveManager: {},
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.currentDriveFileId = null;
    charStore.character.name = 'Hero';

    await handleSaveToDriveClick();

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      null,
    );
  });

  test('saveCharacterToDrive uses provided id', async () => {
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ fileId: '1' }),
      googleDriveManager: {},
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Brave';

    await saveCharacterToDrive('abc');

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      'abc',
    );
  });

  test('saveOrUpdateCurrentCharacterInDrive chooses create or update', async () => {
    const createFile = vi.fn().mockResolvedValue({});
    const updateFile = vi.fn().mockResolvedValue({});
    const dataManager = {
      googleDriveManager: {},
      saveDataToAppData: vi.fn((c, s, ss, e, h, id) => {
        return id ? updateFile(id) : createFile();
      }),
    };
    const { saveOrUpdateCurrentCharacterInDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = null;
    await saveOrUpdateCurrentCharacterInDrive();
    expect(createFile).toHaveBeenCalled();
    uiStore.currentDriveFileId = 'abc';
    await saveOrUpdateCurrentCharacterInDrive();
    expect(updateFile).toHaveBeenCalledWith('abc');
  });
});
