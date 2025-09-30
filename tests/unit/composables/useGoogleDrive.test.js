import { setActivePinia, createPinia } from 'pinia';
import { useGoogleDrive } from '../../../src/composables/useGoogleDrive.js';
import { useCharacterStore } from '../../../src/stores/characterStore.js';
import { useUiStore } from '../../../src/stores/uiStore.js';

vi.mock('../../../src/composables/useNotifications.js', () => ({
  useNotifications: () => ({
    showToast: vi.fn(),
    showAsyncToast: (promise) => promise,
  }),
}));

describe('useGoogleDrive', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('saveCharacterToDrive calls saveDataToDrive and updates current file id', async () => {
    const dataManager = {
      saveDataToDrive: vi.fn().mockResolvedValue({ id: '1', name: 'c.json' }),
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([]),
      setGoogleDriveManager: vi.fn(),
      googleDriveManager: {},
    };

    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();

    charStore.character.name = 'Hero';
    await saveCharacterToDrive(null);

    expect(dataManager.saveDataToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      null,
    );
    expect(uiStore.currentDriveFileId).toBe('1');
  });

  test('saveCharacterToDrive uses provided id', async () => {
    const dataManager = {
      saveDataToDrive: vi.fn().mockResolvedValue({ id: '1', name: 'a.json' }),
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([]),
      setGoogleDriveManager: vi.fn(),
      googleDriveManager: {},
    };
    const { saveCharacterToDrive } = useGoogleDrive(dataManager);
    const charStore = useCharacterStore();
    charStore.character.name = 'Brave';

    await saveCharacterToDrive('abc');

    expect(dataManager.saveDataToDrive).toHaveBeenCalledWith(
      charStore.character,
      charStore.skills,
      charStore.specialSkills,
      charStore.equipments,
      charStore.histories,
      'abc',
    );
  });

  test('saveNewCharacterToDrive resets id before saving', async () => {
    const dataManager = {
      saveDataToDrive: vi.fn().mockResolvedValue({ id: '10', name: 'd.json' }),
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([]),
      setGoogleDriveManager: vi.fn(),
      googleDriveManager: {},
    };
    const { saveNewCharacterToDrive } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();
    uiStore.currentDriveFileId = 'existing';

    await saveNewCharacterToDrive();

    expect(dataManager.saveDataToDrive).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Array),
      expect.any(Array),
      expect.any(Object),
      expect.any(Array),
      null,
    );
    expect(uiStore.currentDriveFileId).toBe('10');
  });

  test('openDriveFile loads data and updates stores', async () => {
    const mockLoadData = vi.fn().mockResolvedValue({
      character: { name: 'Loaded' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    });
    const pickerSpy = vi.fn((cb) => cb(null, { id: 'f1', name: 'Loaded.json' }));
    const dataManager = {
      saveDataToDrive: vi.fn().mockResolvedValue(null),
      loadCharacterListFromDrive: vi.fn().mockResolvedValue([]),
      loadDataFromDrive: mockLoadData,
      setGoogleDriveManager: vi.fn(),
      googleDriveManager: {
        ensureAppFolder: vi.fn().mockResolvedValue('folder'),
        showFilePicker: pickerSpy,
      },
    };
    const { openDriveFile } = useGoogleDrive(dataManager);
    const uiStore = useUiStore();

    await openDriveFile();

    expect(mockLoadData).toHaveBeenCalledWith('f1');
    expect(uiStore.currentDriveFileId).toBe('f1');
  });
});
