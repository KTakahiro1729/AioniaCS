import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '../../../src/composables/useGoogleDrive.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('handleSaveToDriveClick calls saveCharacter with store data', async () => {
    const dataManager = {
      saveCharacter: vi.fn().mockResolvedValue({ fileId: '1', characterName: 'Hero', lastModified: 'd' }),
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.currentDriveFileId = null;
    uiStore.currentDriveFileName = 'c';
    charStore.character.name = 'Hero';

    await handleSaveToDriveClick();

    expect(dataManager.saveCharacter).toHaveBeenCalledWith(
      {
        character: charStore.character,
        skills: charStore.skills,
        specialSkills: charStore.specialSkills,
        equipments: charStore.equipments,
        histories: charStore.histories,
      },
      null,
    );
  });

  test('saveCharacterToDrive uses provided id and name', async () => {
    const dataManager = {
      saveCharacter: vi.fn().mockResolvedValue({ fileId: '1', characterName: 'Brave', lastModified: 'd' }),
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Brave';

    await saveCharacterToDrive('abc', 'foo');

    expect(dataManager.saveCharacter).toHaveBeenCalledWith(
      {
        character: charStore.character,
        skills: charStore.skills,
        specialSkills: charStore.specialSkills,
        equipments: charStore.equipments,
        histories: charStore.histories,
      },
      'abc',
    );
  });

  test('saveOrUpdateCurrentCharacterInDrive chooses create or update', async () => {
    const createFile = vi.fn().mockResolvedValue({ id: '1' });
    const updateFile = vi.fn().mockResolvedValue({ id: '2' });
    const dataManager = {
      saveCharacter: vi.fn((data, id) => {
        return id ? updateFile(id, data, 'c.json') : createFile(data, 'c.json');
      }),
    };
    const { saveOrUpdateCurrentCharacterInDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = null;
    await saveOrUpdateCurrentCharacterInDrive();
    expect(createFile).toHaveBeenCalled();
    uiStore.currentDriveFileId = 'abc';
    uiStore.currentDriveFileName = 'c.json';
    await saveOrUpdateCurrentCharacterInDrive();
    expect(updateFile).toHaveBeenCalledWith('abc', expect.any(Object), 'c.json');
  });
});
