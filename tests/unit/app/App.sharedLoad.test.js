/* @vitest-environment jsdom */
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { defineComponent, ref } from 'vue';
import App from '@/app/App.vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const loadCharacterFromDriveMock = vi.fn();
const isDriveReadyMock = ref(true);
const handleSignInClick = vi.fn();
const handleSignOutClick = vi.fn();
const saveCharacterToDrive = vi.fn();

vi.mock('@/features/cloud-sync/composables/useGoogleDrive.js', () => ({
  useGoogleDrive: () => ({
    canSignInToGoogle: { value: false },
    isDriveReady: isDriveReadyMock,
    handleSignInClick,
    handleSignOutClick,
    saveCharacterToDrive,
    loadCharacterFromDrive: loadCharacterFromDriveMock,
  }),
}));

vi.mock('@/infrastructure/google-drive/index.js', () => ({
  getDriveManagerInstance: () => ({}),
  initializeDriveManager: vi.fn(),
  isUsingMockDrive: vi.fn(),
}));

vi.mock('@/features/modals/composables/useAppModals.js', () => ({
  useAppModals: () => ({
    openLoadModal: vi.fn(),
    openIoModal: vi.fn(),
    openShareModal: vi.fn(),
  }),
}));

vi.mock('@/features/character-sheet/components/CharacterSheetLayout.vue', () => ({
  default: defineComponent({ name: 'CharacterSheetLayout', template: '<div class="layout" />' }),
}));
vi.mock('@/features/character-sheet/components/ui/MainHeader.vue', () => ({
  default: defineComponent({ name: 'MainHeader', template: '<header />', props: ['helpState'] }),
}));
vi.mock('@/features/character-sheet/components/ui/MainFooter.vue', () => ({
  default: defineComponent({ name: 'MainFooter', template: '<footer />', props: ['experienceStatusClass'] }),
}));
vi.mock('@/features/character-sheet/components/ui/HelpPanel.vue', () => ({
  default: defineComponent({ name: 'HelpPanel', template: '<aside />', props: ['isVisible'] }),
}));
vi.mock('@/features/notifications/components/NotificationContainer.vue', () => ({
  default: defineComponent({ name: 'NotificationContainer', template: '<div class="notifications" />' }),
}));
vi.mock('@/features/modals/components/BaseModal.vue', () => ({
  default: defineComponent({ name: 'BaseModal', template: '<div class="modal" />' }),
}));

vi.mock('@/features/character-sheet/composables/useDataExport.js', () => ({
  useDataExport: () => ({
    dataManager: {},
    saveData: vi.fn(),
    handleFileUpload: vi.fn(),
    outputToCocofolia: vi.fn(),
    getChatPaletteText: vi.fn(),
    printCharacterSheet: vi.fn(),
    openPreviewPage: vi.fn(),
  }),
}));

vi.mock('@/features/character-sheet/composables/usePrint.js', () => ({
  usePrint: () => ({ printCharacterSheet: vi.fn(), openPreviewPage: vi.fn() }),
}));
vi.mock('@/features/cloud-sync/composables/useLocalCharacterPersistence.js', () => ({
  useLocalCharacterPersistence: () => ({ clearLocalDraft: vi.fn() }),
}));
vi.mock('@/shared/composables/useKeyboardHandling.js', () => ({ useKeyboardHandling: () => {} }));
vi.mock('@/shared/composables/useHelp.js', () => ({
  useHelp: () => ({
    helpState: {},
    isHelpVisible: false,
    handleHelpIconMouseOver: vi.fn(),
    handleHelpIconMouseLeave: vi.fn(),
    handleHelpIconClick: vi.fn(),
    closeHelpPanel: vi.fn(),
  }),
}));
vi.mock('@/features/notifications/composables/useNotifications.js', () => ({
  useNotifications: () => ({ showToast: vi.fn(), showAsyncToast: vi.fn(), logAndToastError: vi.fn() }),
}));

describe('App sharedId loading', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    loadCharacterFromDriveMock.mockReset();
    isDriveReadyMock.value = true;
    window.history.replaceState({}, '', `${window.location.origin}/?sharedId=drive-file-1`);
  });

  it('loads shared drive id on mount when signed in and ready', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    loadCharacterFromDriveMock.mockResolvedValue({ ok: true });

    mount(App);
    await flushPromises();

    expect(loadCharacterFromDriveMock).toHaveBeenCalledWith('drive-file-1');
    expect(new URL(window.location.href).searchParams.get('sharedId')).toBeNull();
    expect(uiStore.isViewingShared).toBe(true);
  });

  it('defers shared load until drive is ready', async () => {
    const uiStore = useUiStore();
    uiStore.isSignedIn = true;
    isDriveReadyMock.value = false;
    loadCharacterFromDriveMock.mockResolvedValue({ ok: true });

    mount(App);
    await flushPromises();
    expect(loadCharacterFromDriveMock).not.toHaveBeenCalled();

    isDriveReadyMock.value = true;
    await flushPromises();

    expect(loadCharacterFromDriveMock).toHaveBeenCalledWith('drive-file-1');
  });
});
