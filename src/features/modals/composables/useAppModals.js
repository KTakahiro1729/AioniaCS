import { defineAsyncComponent } from 'vue';
import { useModal } from './useModal.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
const CharacterHub = defineAsyncComponent(() => import('@/features/character-sheet/components/ui/CharacterHub.vue'));
const IoModal = defineAsyncComponent(() => import('@/features/modals/components/contents/IoModal.vue'));
const ShareOptions = defineAsyncComponent(() => import('@/features/modals/components/contents/ShareOptions.vue'));
import { isDesktopDevice } from '@/shared/utils/device.js';
import { messages } from '@/locales/ja.js';

export function useAppModals(options) {
  const uiStore = useUiStore();
  const { showModal } = useModal();
  const { dataManager, saveData, handleFileUpload, outputToCocofolia, printCharacterSheet, openPreviewPage, copyEditCallback } = options;

  async function openHub() {
    await showModal({
      component: CharacterHub,
      title: messages.ui.modal.hubTitle,
      props: {
        dataManager,
      },
      buttons: [],
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
    await showModal({
      component: ShareOptions,
      props: { dataManager },
      title: messages.ui.modal.shareTitle,
      buttons: [
        {
          label: messages.ui.modal.cancel,
          value: 'cancel',
          variant: 'secondary',
        },
      ],
    });
  }

  return { openHub, openIoModal, openShareModal };
}
