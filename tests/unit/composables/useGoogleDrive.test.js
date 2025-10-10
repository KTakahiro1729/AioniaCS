import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { auth0State } from '@auth0/auth0-vue';

const driveManagerStub = {
  loadConfig: vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア' }),
  setCharacterFolderPath: vi.fn().mockResolvedValue('慈悲なきアイオニア'),
  findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-id'),
  listFiles: vi.fn().mockResolvedValue([]),
  normalizeFolderPath: vi.fn((value) => value.replace(/\\/g, '/')),
  setAccessTokenProvider: vi.fn(),
};

vi.mock('@/infrastructure/google-drive/googleDriveManager.js', () => ({
  initializeGoogleDriveManager: vi.fn(() => driveManagerStub),
  getGoogleDriveManagerInstance: vi.fn(() => driveManagerStub),
}));

vi.mock('@/infrastructure/google-drive/mockGoogleDriveManager.js', () => ({
  initializeMockGoogleDriveManager: vi.fn(() => driveManagerStub),
  getMockGoogleDriveManagerInstance: vi.fn(() => driveManagerStub),
}));

vi.mock('@auth0/auth0-vue', () => {
  const state = {
    isAuthenticated: ref(true),
    isLoading: ref(false),
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
  };
  return {
    useAuth0: () => state,
    auth0State: state,
  };
});

vi.mock('@/features/modals/composables/useModal.js', () => ({
  useModal: vi.fn(),
}));

import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useModal } from '@/features/modals/composables/useModal.js';

describe('useGoogleDrive', () => {
  const originalPrompt = window.prompt;
  let showModalMock;

  beforeEach(() => {
    setActivePinia(createPinia());
    window.prompt = vi.fn();
    showModalMock = vi.fn().mockResolvedValue({ value: 'overwrite' });
    useModal.mockReturnValue({ showModal: showModalMock });
    auth0State.isAuthenticated.value = true;
    auth0State.isLoading.value = false;
    auth0State.loginWithRedirect.mockClear();
    auth0State.logout.mockClear();
    auth0State.getAccessTokenSilently.mockResolvedValue('token');
    Object.assign(driveManagerStub, {
      loadConfig: vi.fn().mockResolvedValue({ characterFolderPath: '慈悲なきアイオニア' }),
      setCharacterFolderPath: vi.fn().mockResolvedValue('慈悲なきアイオニア/PC/第一キャンペーン'),
      findOrCreateConfiguredCharacterFolder: vi.fn().mockResolvedValue('folder-id'),
      listFiles: vi.fn().mockResolvedValue([]),
      normalizeFolderPath: vi.fn((value) => value.replace(/\\/g, '/')),
      setAccessTokenProvider: vi.fn(),
    });
  });

  afterEach(() => {
    window.prompt = originalPrompt;
    vi.clearAllMocks();
  });

  async function mountComposable(dataManager) {
    const composable = useGoogleDrive(dataManager);
    await nextTick();
    return composable;
  }

  test('saveCharacterToDrive updates an existing file when current id is set', async () => {
    const dataManager = {
      saveCharacterToDrive: vi.fn().mockResolvedValue({ id: 'existing-id', name: 'Hero.json' }),
      findDriveFileByCharacterName: vi.fn(),
      googleDriveManager: driveManagerStub,
      setGoogleDriveManager(manager) {
        this.googleDriveManager = manager;
      },
    };
    const { saveCharacterToDrive } = await mountComposable(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    charStore.character.name = 'Hero';
    uiStore.setCurrentDriveFileId('existing-id');
    uiStore.isSignedIn = true;

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
      googleDriveManager: driveManagerStub,
      setGoogleDriveManager(manager) {
        this.googleDriveManager = manager;
      },
    };
    showModalMock.mockResolvedValue({ value: 'overwrite' });
    const { saveCharacterToDrive } = await mountComposable(dataManager);
    const charStore = useCharacterStore();
    const uiStore = useUiStore();
    charStore.character.name = 'Hero';
    uiStore.isSignedIn = true;
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

  test('promptForDriveFolder applies prompt selection', async () => {
    const desiredPath = '慈悲なきアイオニア/PC/第一キャンペーン';
    driveManagerStub.setCharacterFolderPath.mockResolvedValue(desiredPath);
    driveManagerStub.findOrCreateConfiguredCharacterFolder.mockResolvedValue('folder-id');
    window.prompt = vi.fn().mockReturnValue(desiredPath);

    const dataManager = {
      googleDriveManager: driveManagerStub,
      setGoogleDriveManager(manager) {
        this.googleDriveManager = manager;
      },
    };

    const { promptForDriveFolder } = await mountComposable(dataManager);
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;

    const selected = await promptForDriveFolder();

    expect(window.prompt).toHaveBeenCalled();
    expect(driveManagerStub.setCharacterFolderPath).toHaveBeenCalledWith(desiredPath);
    expect(selected).toBe(desiredPath);
    expect(uiStore.driveFolderPath).toBe(desiredPath);
  });

  test('loadCharacterFromDrive loads data and updates store', async () => {
    const loadData = {
      character: { name: 'Explorer' },
      skills: [],
      specialSkills: [],
      equipments: {},
      histories: [],
    };
    driveManagerStub.listFiles.mockResolvedValue([{ id: 'file-1', name: 'Explorer.json' }]);

    const dataManager = {
      saveCharacterToDrive: vi.fn(),
      findDriveFileByCharacterName: vi.fn(),
      loadDataFromDrive: vi.fn().mockResolvedValue(loadData),
      googleDriveManager: driveManagerStub,
      setGoogleDriveManager(manager) {
        this.googleDriveManager = manager;
      },
    };

    const { loadCharacterFromDrive } = await mountComposable(dataManager);
    const uiStore = useUiStore();
    const charStore = useCharacterStore();
    uiStore.isSignedIn = true;

    const result = await loadCharacterFromDrive();

    expect(result).toEqual(loadData);
    expect(charStore.character.name).toBe('Explorer');
    expect(uiStore.currentDriveFileId).toBe('file-1');
  });
});
