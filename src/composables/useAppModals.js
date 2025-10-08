import { reactive, defineAsyncComponent } from 'vue';
import { useModal } from './useModal.js';
import { useUiStore } from '../stores/uiStore.js';
const CharacterHub = defineAsyncComponent(() => import('../components/ui/CharacterHub.vue'));
const IoModal = defineAsyncComponent(() => import('../components/modals/contents/IoModal.vue'));
const ShareOptions = defineAsyncComponent(() => import('../components/modals/contents/ShareOptions.vue'));

import { useShare } from './useShare.js';
import { useNotifications } from './useNotifications.js';
import { isDesktopDevice } from '../utils/device.js';
import { messages } from '../locales/ja.js';

export function useAppModals(options) {
  const uiStore = useUiStore();
  const { showModal } = useModal();
  const {
    dataManager,
    saveCharacterToDrive,
    handleSignInClick,
    handleSignOutClick,
    saveData,
    handleFileUpload,
    outputToCocofolia,
    printCharacterSheet,
    openPreviewPage,
    copyEditCallback,
  } = options;

  async function openHub() {
    await showModal({
      component: CharacterHub,
      title: messages.ui.modal.hubTitle,
      props: {
        dataManager,
      },
      buttons: [],
      on: {
        'sign-in': handleSignInClick,
        'sign-out': handleSignOutClick,
      },
    });
  }

  async function openIoModal() {
    const handlePrint = isDesktopDevice() ? printCharacterSheet : openPreviewPage;
    await showModal({
      component: IoModal,
      title: messages.ui.modal.io.title,
      props: {
        signedIn: uiStore.isSignedIn,
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
    const { generateShare, copyLink } = useShare(dataManager, saveCharacterToDrive);
    const { showToast } = useNotifications();
    const shareState = reactive({
      shareLink: '',
      isGenerating: false,
    });

    async function handleShare() {
      if (shareState.isGenerating) return;
      shareState.isGenerating = true;
      try {
        const link = await generateShare();
        if (link) {
          shareState.shareLink = link;
          await copyLink(link);
        }
      } catch (err) {
        showToast({
          type: 'error',
          title: messages.ui.modal.shareFailed,
          message: err.message,
        });
      } finally {
        shareState.isGenerating = false;
      }
    }

    async function handleCopy(link) {
      if (!link) return;
      await copyLink(link);
    }

    await showModal({
      component: ShareOptions,
      props: shareState,
      title: messages.ui.modal.shareTitle,
      buttons: [
        {
          label: messages.ui.modal.cancel,
          value: 'cancel',
          variant: 'secondary',
        },
      ],
      on: {
        signin: handleSignInClick,
        share: handleShare,
        copy: handleCopy,
      },
    });
  }

  return { openHub, openIoModal, openShareModal };
}
