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
      saveDataToAppData: vi.fn().mockResolvedValue({ fileId: '1', characterName: 'c' }),
      googleDriveManager: {},
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.currentDriveFileId = null;
    uiStore.currentDriveFileName = 'c';
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

  test('saveCharacterToDrive uses provided id and name', async () => {
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ fileId: '1', characterName: 'a' }),
      googleDriveManager: {},
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Brave';

    await saveCharacterToDrive('abc', 'foo');

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
    const saveCharacter = vi.fn().mockResolvedValue({ fileId: '1' });
    const dataManager = {
      googleDriveManager: {
        saveCharacter,
      },
      saveDataToAppData: vi.fn((c, s, ss, e, h, id) => {
        return saveCharacter({}, id);
      }),
    };
    const { saveOrUpdateCurrentCharacterInDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = null;
    await saveOrUpdateCurrentCharacterInDrive();
    expect(saveCharacter).toHaveBeenCalled();
    uiStore.currentDriveFileId = 'abc';
    uiStore.currentDriveFileName = 'c.json';
    await saveOrUpdateCurrentCharacterInDrive();
    expect(saveCharacter).toHaveBeenCalledWith(expect.any(Object), 'abc');
  });
});
