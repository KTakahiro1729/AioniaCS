import { defineAsyncComponent, watch } from 'vue';
import { useModal } from './useModal.js';
import { useModalStore } from '@/features/modals/stores/modalStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
const LoadModal = defineAsyncComponent(() => import('@/features/modals/components/contents/LoadModal.vue'));
const IoModal = defineAsyncComponent(() => import('@/features/modals/components/contents/IoModal.vue'));
const ShareResultModal = defineAsyncComponent(() => import('@/features/modals/components/contents/ShareResultModal.vue'));
import { isDesktopDevice } from '@/shared/utils/device.js';
import { messages } from '@/i18n/index.js';
import { useShare } from '@/features/cloud-sync/composables/useShare.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';

export function useAppModals(options) {
  const uiStore = useUiStore();
  const { showModal } = useModal();
  const modalStore = useModalStore();
  const { showToast, showAsyncToast, logAndToastError } = useNotifications();
  const { createShareLink } = useShare(options.dataManager);
  const {
    handleSignInClick,
    saveData,
    handleFileUpload,
    outputToCocofolia,
    getChatPaletteText,
    printCharacterSheet,
    openPreviewPage,
    copyEditCallback,
    loadCharacterFromDrive,
    promptForDriveFolder,
    updateDriveFolderPath,
    canSignInToGoogle,
    isDriveReady,
    prefetchDriveAccessToken,
    isDriveTokenWarm,
    isDriveActionInFlight,
  } = options;

  async function openLoadModal() {
    let hasPrefetchedDriveToken = false;
    const triggerPrefetch = (values) => {
      if (hasPrefetchedDriveToken || typeof prefetchDriveAccessToken !== 'function' || !values.isSignedIn || !values.isDriveReady) {
        return;
      }
      hasPrefetchedDriveToken = true;
      prefetchDriveAccessToken();
    };

    const initialProps = {
      isSignedIn: uiStore.isSignedIn,
      canSignIn: canSignInToGoogle?.value ?? false,
      isDriveReady: isDriveReady?.value ?? false,
      driveFolderPath: uiStore.driveFolderPath,
      driveFolderLabel: messages.characterHub.driveFolder.label,
      driveFolderPlaceholder: messages.characterHub.driveFolder.placeholder,
      changeFolderLabel: messages.characterHub.driveFolder.changeButton,
      loadLocalLabel: messages.ui.modal.load.buttons.loadLocal,
      loadDriveLabel: messages.ui.modal.load.buttons.loadDrive,
      signInLabel: messages.characterHub.buttons.signIn,
      signInMessage: messages.ui.modal.load.signInMessage,
      isDriveTokenWarm: isDriveTokenWarm?.value ?? false,
      isDriveActionLoading: isDriveActionInFlight?.value ?? false,
    };

    triggerPrefetch(initialProps);

    const modalPromise = showModal({
      component: LoadModal,
      title: messages.ui.modal.load.title,
      props: initialProps,
      buttons: [],
      on: {
        'load-local': handleFileUpload,
        'load-drive': loadCharacterFromDrive,
        'sign-in': handleSignInClick,
        'update-drive-folder-path': updateDriveFolderPath,
        'choose-drive-folder': promptForDriveFolder,
      },
    });

    const stopSync = watch(
      () => ({
        isSignedIn: uiStore.isSignedIn,
        canSignIn: canSignInToGoogle?.value ?? false,
        isDriveReady: isDriveReady?.value ?? false,
        driveFolderPath: uiStore.driveFolderPath,
        isDriveTokenWarm: isDriveTokenWarm?.value ?? false,
        isDriveActionLoading: isDriveActionInFlight?.value ?? false,
      }),
      (values) => {
        if (modalStore.component === LoadModal) {
          Object.assign(modalStore.props, values);
        }
        triggerPrefetch(values);
      },
      { immediate: true },
    );

    try {
      await modalPromise;
    } finally {
      stopSync();
    }
  }

  async function handleOutputChatPalette() {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      const clipboardError = new Error(messages.ui.modal.io.chatPalette.clipboardUnavailable);
      logAndToastError(clipboardError, messages.ui.modal.io.chatPalette.error, 'handleOutputChatPalette');
      return;
    }
    if (typeof getChatPaletteText !== 'function') {
      const missingGeneratorError = new Error('チャットパレットのデータを取得できません');
      logAndToastError(missingGeneratorError, messages.ui.modal.io.chatPalette.error, 'handleOutputChatPalette');
      return;
    }

    try {
      const paletteText = (await getChatPaletteText()) ?? '';
      await navigator.clipboard.writeText(paletteText);
      showToast({ type: 'success', ...messages.ui.modal.io.chatPalette.success() });
    } catch (error) {
      logAndToastError(error, messages.ui.modal.io.chatPalette.error, 'handleOutputChatPalette');
    }
  }

  async function openIoModal() {
    const handlePrint = isDesktopDevice() ? printCharacterSheet : openPreviewPage;
    await showModal({
      component: IoModal,
      title: messages.ui.modal.io.title,
      props: {
        signedIn: uiStore.isSignedIn,
        localOutputLabel: messages.ui.modal.io.buttons.saveLocal,
        outputLabels: {
          default: messages.outputButton.default,
          animating: messages.outputButton.animating,
          success: messages.outputButton.success,
        },
        outputTimings: messages.outputButton.animationTimings,
        printLabel: messages.ui.modal.io.buttons.print,
        chatPaletteLabel: messages.ui.modal.io.buttons.chatPalette,
      },
      buttons: [],
      on: {
        'save-local': saveData,
        'output-cocofolia': outputToCocofolia,
        'output-chat-palette': handleOutputChatPalette,
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
    if (!uiStore.isSignedIn) {
      showToast({ type: 'error', ...messages.share.needSignIn() });
      return;
    }
    const sharePromise = createShareLink();

    showAsyncToast(
      sharePromise,
      {
        loading: messages.share.toast.creating(),
        success: messages.share.toast.success(),
        error: (err) => messages.share.toast.error(err),
      },
      'openShareModal',
    );

    sharePromise
      .then((link) =>
        showModal({
          component: ShareResultModal,
          title: messages.share.resultModal.title,
          props: {
            shareUrl: link,
            description: messages.share.resultModal.description,
            urlLabel: messages.share.resultModal.urlLabel,
            copyLabel: messages.share.resultModal.copyLabel,
          },
          buttons: [],
        }),
      )
      .catch((error) => console.error('Failed to show share result modal:', error));

    return sharePromise;
  }

  return { openLoadModal, openIoModal, openShareModal };
}
