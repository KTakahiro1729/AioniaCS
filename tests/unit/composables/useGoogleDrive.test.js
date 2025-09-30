import { setActivePinia, createPinia } from 'pinia';
import { vi } from 'vitest';
import { useGoogleDrive } from '../../../src/composables/useGoogleDrive.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/services/googleDriveManager.js', async (orig) => {
  const actual = await orig();
  return { ...actual, DRIVE_FOLDER_NAME: 'AioniaCS' };
});

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('saveFile calls dataManager and refreshes drive characters', async () => {
    const refreshSpy = vi.spyOn(useUiStore(), 'refreshDriveCharacters').mockResolvedValue();
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ id: 'file-1', name: 'hero.json' }),
      googleDriveManager: {},
    };

    const { saveFile } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Hero';

    await saveFile();

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      null,
    );
    expect(refreshSpy).toHaveBeenCalled();
  });

  test('saveAsNewFile clears id before saving', async () => {
    const refreshSpy = vi.spyOn(useUiStore(), 'refreshDriveCharacters').mockResolvedValue();
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ id: 'file-2', name: 'mage.json' }),
      googleDriveManager: {},
    };

    const { saveAsNewFile } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = 'existing';

    await saveAsNewFile();

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
    );
    expect(refreshSpy).toHaveBeenCalled();
    expect(uiStore.currentDriveFileId).toBe('file-2');
  });

  test('overwriteFile keeps current id when saving', async () => {
    const refreshSpy = vi.spyOn(useUiStore(), 'refreshDriveCharacters').mockResolvedValue();
    const dataManager = {
      saveDataToAppData: vi.fn().mockResolvedValue({ id: 'file-3', name: 'rogue.json' }),
      googleDriveManager: {},
    };

    const { overwriteFile } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = 'file-3';

    await overwriteFile();

    expect(dataManager.saveDataToAppData).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      'file-3',
    );
    expect(refreshSpy).toHaveBeenCalled();
  });
});
