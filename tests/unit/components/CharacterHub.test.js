import { setActivePinia, createPinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import CharacterHub from '@/features/character-sheet/components/ui/CharacterHub.vue';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

vi.mock('@/features/cloud-sync/composables/useGoogleDrive.js', () => ({
  useGoogleDrive: vi.fn(),
}));

describe('CharacterHub', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  function mountComponent(overrides = {}) {
    const promptForDriveFolder = overrides.promptForDriveFolder || vi.fn().mockResolvedValue('慈悲なきアイオニア/PC/第一キャンペーン');
    const isDriveReady = ref(true);
    const canSignInToGoogle = ref(false);

    useGoogleDrive.mockReturnValue({
      loadCharacterFromDrive: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      isDriveReady,
      canSignInToGoogle,
      updateDriveFolderPath: vi.fn(),
      promptForDriveFolder,
    });

    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    uiStore.isGapiInitialized = true;
    uiStore.isGisInitialized = true;

    const wrapper = mount(CharacterHub, {
      props: {
        dataManager: {},
      },
    });

    return { wrapper, promptForDriveFolder };
  }

  test('folder picker button triggers prompt', async () => {
    const { wrapper, promptForDriveFolder } = mountComponent();
    const changeButton = wrapper.get('.character-hub--change-button');

    await changeButton.trigger('click');

    expect(promptForDriveFolder).toHaveBeenCalledTimes(1);
  });

  test('updates input when picker resolves with new path', async () => {
    const desiredPath = '慈悲なきアイオニア/PC/第二キャンペーン';
    const promptForDriveFolder = vi.fn().mockResolvedValue(desiredPath);
    const { wrapper } = mountComponent({ promptForDriveFolder });
    const changeButton = wrapper.get('.character-hub--change-button');

    await changeButton.trigger('click');
    await flushPromises();

    const input = wrapper.get('#drive_folder_path');
    expect(input.element.value).toBe(desiredPath);
  });
});
