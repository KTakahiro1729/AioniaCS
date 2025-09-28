import { reactive, defineAsyncComponent, h } from 'vue';
import { useModal } from './useModal.js';
import { useUiStore } from '../stores/uiStore.js';
const CharacterHub = defineAsyncComponent(() => import('../components/ui/CharacterHub.vue'));
const IoModal = defineAsyncComponent(() => import('../components/modals/contents/IoModal.vue'));
const ShareOptions = defineAsyncComponent(() => import('../components/modals/contents/ShareOptions.vue'));

import { useShare } from './useShare.js';
import { useNotifications } from './useNotifications.js';
import { useModalStore } from '../stores/modalStore.js';
import { isDesktopDevice } from '../utils/device.js';
import { messages } from '../locales/ja.js';
import { useAuth0 } from '@auth0/auth0-vue';

export function useAppModals(options) {
  const uiStore = useUiStore();
  const { showModal } = useModal();
  const {
    dataManager,
    loadCharacterById,
    saveCharacterToCloud,
    handleSignInClick,
    handleSignOutClick,
    saveData,
    handleFileUpload,
    outputToCocofolia,
    printCharacterSheet,
    openPreviewPage,
    copyEditCallback,
  } = options;
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  async function openHub() {
    const headerActions = {
      name: 'CharacterHubHeaderActions',
      setup() {
        return () => {
          if (!isAuthenticated.value) {
            return h(
              'button',
              {
                class: 'button-base button-compact modal-header-login',
                type: 'button',
                onClick: () => (typeof handleSignInClick === 'function' ? handleSignInClick() : loginWithRedirect()),
              },
              messages.characterHub.actions.login,
            );
          }
          return h('div', { class: 'modal-header-user' }, [
            h('span', { class: 'modal-header-user__name' }, user.value?.name || messages.characterHub.labels.anonymous),
            h(
              'button',
              {
                class: 'button-base button-compact modal-header-logout',
                type: 'button',
                onClick: () =>
                  typeof handleSignOutClick === 'function'
                    ? handleSignOutClick()
                    : logout({ logoutParams: { returnTo: window.location.origin } }),
              },
              messages.characterHub.actions.logout,
            ),
          ]);
        };
      },
    };
    await showModal({
      component: CharacterHub,
      title: messages.ui.modal.hubTitle,
      props: {
        dataManager,
        loadCharacter: loadCharacterById,
        saveToCloud: saveCharacterToCloud,
      },
      buttons: [],
      headerActions,
    });
  }

  async function openIoModal() {
    const handlePrint = isDesktopDevice() ? printCharacterSheet : openPreviewPage;
    await showModal({
      component: IoModal,
      title: messages.ui.modal.io.title,
      props: {
        saveLocalLabel: messages.ui.modal.io.buttons.saveLocal,
        loadLocalLabel: messages.ui.modal.io.buttons.loadLocal,
        outputLabels: {
          default: messages.outputButton.default,
          animating: messages.outputButton.animating,
          success: messages.outputButton.success,
        },
        outputTimings: messages.outputButton.animationTimings,
        printLabel: messages.ui.modal.io.buttons.print,
      },
      buttons: [],
      on: {
        'save-local': saveData,
        'load-local': handleFileUpload,
        'output-cocofolia': outputToCocofolia,
        print: handlePrint,
      },
    });
  }

  async function openShareModal() {
    if (uiStore.isViewingShared) {
      if (typeof copyEditCallback === 'function') {
        copyEditCallback();
      }
      return;
    }
    const { generateShare, copyLink, isLongData } = useShare();
    const { showToast } = useNotifications();
    const modalStore = useModalStore();
    window.__cloudSignIn = loginWithRedirect;
    const generateButton = reactive({
      label: messages.ui.modal.generate,
      value: 'generate',
      variant: 'primary',
      disabled: true,
    });
    function updateCanGenerate(v) {
      generateButton.disabled = !v;
    }
    let result;
    try {
      result = await showModal({
        component: ShareOptions,
        props: { signedIn: uiStore.isSignedIn, longData: isLongData() },
        title: messages.ui.modal.shareTitle,
        buttons: [
          generateButton,
          {
            label: messages.ui.modal.cancel,
            value: 'cancel',
            variant: 'secondary',
          },
        ],
        on: { 'update:canGenerate': updateCanGenerate },
      });
    } finally {
      delete window.__cloudSignIn;
    }
    if (result.value !== 'generate' || !result.component) return;
    const optsComp = result.component;
    const opts = {
      type: optsComp.type.value,
      includeFull: optsComp.includeFull.value,
      password: optsComp.password.value || '',
      expiresInDays: Number(optsComp.expires.value) || 0,
    };
    try {
      const link = await generateShare(opts);
      await copyLink(link);
      modalStore.hideModal();
    } catch (err) {
      showToast({
        type: 'error',
        title: messages.ui.modal.shareFailed,
        message: err.message,
      });
    }
  }

  return { openHub, openIoModal, openShareModal };
}
