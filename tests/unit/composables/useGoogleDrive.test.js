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
      saveDataToAppData: vi.fn().mockResolvedValue({ id: '1', name: 'c.json' }),
      googleDriveManager: { getWorkspaceFolderId: vi.fn().mockReturnValue('folder-1') },
    };

    const { handleSaveToDriveClick } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    uiStore.currentDriveFileId = null;
    uiStore.setDriveFolder({ id: 'folder-1', name: 'AioniaCS' });
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
      saveDataToAppData: vi.fn().mockResolvedValue({ id: '1', name: 'a.json' }),
      googleDriveManager: { getWorkspaceFolderId: vi.fn().mockReturnValue('folder-1') },
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Brave';
    const uiStore = useUiStore();
    uiStore.setDriveFolder({ id: 'folder-1', name: 'AioniaCS' });

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
    const createFile = vi.fn().mockResolvedValue({ id: '1' });
    const updateFile = vi.fn().mockResolvedValue({ id: '2' });
    const dataManager = {
      googleDriveManager: {
        createCharacterFile: createFile,
        updateCharacterFile: updateFile,
        getWorkspaceFolderId: vi.fn().mockReturnValue('folder-1'),
      },
      saveDataToAppData: vi.fn((c, s, ss, e, h, id) => {
        return id ? updateFile(id, {}) : createFile({});
      }),
    };
    const { saveOrUpdateCurrentCharacterInDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = null;
    uiStore.setDriveFolder({ id: 'folder-1', name: 'AioniaCS' });
    await saveOrUpdateCurrentCharacterInDrive();
    expect(createFile).toHaveBeenCalled();
    uiStore.currentDriveFileId = 'abc';
    await saveOrUpdateCurrentCharacterInDrive();
    expect(updateFile).toHaveBeenCalledWith('abc', expect.any(Object));
  });

  test('promptForDriveFolder updates workspace folder state', async () => {
    const setWorkspaceFolder = vi.fn();
    const dataManager = {
      googleDriveManager: {
        showFolderPicker: (cb) => cb(null, { id: 'folder-2', name: 'Custom' }),
        setWorkspaceFolder,
      },
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([]),
    };

    const { promptForDriveFolder } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    await promptForDriveFolder();

    expect(setWorkspaceFolder).toHaveBeenCalledWith({ id: 'folder-2', name: 'Custom' });
    expect(uiStore.driveFolderId).toBe('folder-2');
    expect(uiStore.driveFolderName).toBe('Custom');
  });
});
