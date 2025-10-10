import { setActivePinia, createPinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import CharacterHub from '@/features/character-sheet/components/ui/CharacterHub.vue';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

vi.mock('@/features/cloud-sync/composables/useGoogleDrive.js', () => ({
  useGoogleDrive: vi.fn(),
}));

const isAuthenticated = ref(false);
const isLoading = ref(false);
const user = ref(null);
const loginWithRedirect = vi.fn();
const logout = vi.fn();

vi.mock('@auth0/auth0-vue', () => ({
  useAuth0: () => ({
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
  }),
}));

describe('CharacterHub', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    isAuthenticated.value = false;
    isLoading.value = false;
    user.value = null;
    loginWithRedirect.mockReset();
    logout.mockReset();
  });

  function mountComponent(overrides = {}) {
    const promptForDriveFolder = overrides.promptForDriveFolder || vi.fn().mockResolvedValue('慈悲なきアイオニア/PC/第一キャンペーン');
    const isDriveReady = ref(true);

    useGoogleDrive.mockReturnValue({
      loadCharacterFromDrive: vi.fn(),
      saveCharacterToDrive: vi.fn(),
      isDriveReady,
      updateDriveFolderPath: vi.fn(),
      promptForDriveFolder,
    });

    const uiStore = useUiStore();
    uiStore.isSignedIn = isAuthenticated.value;
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
    isAuthenticated.value = true;
    const { wrapper, promptForDriveFolder } = mountComponent();
    const changeButton = wrapper.get('.character-hub--change-button');

    await changeButton.trigger('click');

    expect(promptForDriveFolder).toHaveBeenCalledTimes(1);
  });

  test('updates input when picker resolves with new path', async () => {
    isAuthenticated.value = true;
    const desiredPath = '慈悲なきアイオニア/PC/第二キャンペーン';
    const promptForDriveFolder = vi.fn().mockResolvedValue(desiredPath);
    const { wrapper } = mountComponent({ promptForDriveFolder });
    const changeButton = wrapper.get('.character-hub--change-button');

    await changeButton.trigger('click');
    await flushPromises();

    const input = wrapper.get('#drive_folder_path');
    expect(input.element.value).toBe(desiredPath);
  });

  test('invokes Auth0 login on sign-in button click', async () => {
    isAuthenticated.value = false;
    isLoading.value = false;

    const { wrapper } = mountComponent();
    const signInButton = wrapper.get('.character-hub--button');

    await signInButton.trigger('click');

    expect(loginWithRedirect).toHaveBeenCalledTimes(1);
  });

  test('invokes Auth0 logout on sign-out button click', async () => {
    isAuthenticated.value = true;
    isLoading.value = false;

    const { wrapper } = mountComponent();
    const signOutButton = wrapper.get('.character-hub--button:last-of-type');

    await signOutButton.trigger('click');

    expect(logout).toHaveBeenCalledWith({ returnTo: window.location.origin });
  });
});
