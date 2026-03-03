import { defineAsyncComponent, watch } from 'vue';
import { useModal } from './useModal.js';
import { useModalStore } from '@/features/modals/stores/modalStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
const LoadModal = defineAsyncComponent(() => import('@/features/modals/components/contents/LoadModal.vue'));
const HistoryRecoveryModal = defineAsyncComponent(() => import('@/features/modals/components/contents/HistoryRecoveryModal.vue'));
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
    updateDriveFolderPath,
    loadCharacterFromDrive,
    canSignInToGoogle,
    isDriveReady,
    getLocalHistoryList,
    restoreCharacterFromHistory,
  } = options;

  const historyExists = () => {
    const list = typeof getLocalHistoryList === 'function' ? getLocalHistoryList() : [];
    return Array.isArray(list) && list.length > 0;
  };

  async function openLoadModal() {
    const initialProps = {
      isSignedIn: uiStore.isSignedIn,
      canSignIn: canSignInToGoogle?.value ?? false,
      isDriveReady: isDriveReady?.value ?? false,
      driveFolderPath: uiStore.driveFolderPath,
      driveFolderLabel: messages.characterHub.driveFolder.label,
      driveFolderChangeLabel: messages.characterHub.driveFolder.confirmButton,
      driveFolderPlaceholder: messages.characterHub.driveFolder.placeholder,
      driveFolderCreateConfirmMessage: messages.characterHub.driveFolder.createConfirm,
      driveFolderCreateYesLabel: messages.characterHub.driveFolder.createYes,
      driveFolderCreateNoLabel: messages.characterHub.driveFolder.createNo,
      loadLocalLabel: messages.ui.modal.load.buttons.loadLocal,
      restoreHistoryLabel: messages.ui.modal.load.buttons.restoreHistory,
      loadCharacterFromDrive,
      hasHistory: historyExists(),
      signInLabel: messages.characterHub.buttons.signIn,
      signInMessage: messages.ui.modal.load.signInMessage,
    };

    const modalPromise = showModal({
      component: LoadModal,
      title: messages.ui.modal.load.title,
      size: 'wide',
      props: initialProps,
      buttons: [],
      on: {
        'load-local': handleFileUpload,
        'sign-in': handleSignInClick,
        'update-drive-folder-path': updateDriveFolderPath,
        'open-history': () => openHistoryRecoveryModal(),
      },
    });

    const stopSync = watch(
      () => ({
        isSignedIn: uiStore.isSignedIn,
        canSignIn: canSignInToGoogle?.value ?? false,
        isDriveReady: isDriveReady?.value ?? false,
        driveFolderPath: uiStore.driveFolderPath,
        hasHistory: historyExists(),
      }),
      (values) => {
        if (modalStore.component === LoadModal) {
          Object.assign(modalStore.props, values);
        }
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

  async function openHistoryRecoveryModal() {
    const historyList = typeof getLocalHistoryList === 'function' ? getLocalHistoryList() : [];
    if (!Array.isArray(historyList) || historyList.length === 0) {
      return;
    }
    await showModal({
      component: HistoryRecoveryModal,
      title: messages.ui.modal.historyRecovery.title,
      props: {
        historyList,
        description: messages.ui.modal.historyRecovery.description,
        emptyLabel: messages.ui.modal.historyRecovery.empty,
        cancelLabel: messages.ui.modal.historyRecovery.cancel,
        confirmMessage: messages.ui.modal.historyRecovery.confirm,
      },
      buttons: [],
      on: {
        restore: (item) => {
          if (typeof restoreCharacterFromHistory === 'function') {
            restoreCharacterFromHistory(item);
          }
          modalStore.hideModal();
        },
        close: () => modalStore.hideModal(),
      },
    });
  }

  return { openLoadModal, openIoModal, openShareModal, openHistoryRecoveryModal };
}
