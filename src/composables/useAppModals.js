import { reactive, defineAsyncComponent } from "vue";
import { useModal } from "./useModal.js";
import { useUiStore } from "../stores/uiStore.js";
const CharacterHub = defineAsyncComponent(
  () => import("../components/ui/CharacterHub.vue"),
);
const CharacterHubControls = defineAsyncComponent(
  () => import("../components/ui/CharacterHubControls.vue"),
);
const IoModal = defineAsyncComponent(
  () => import("../components/modals/contents/IoModal.vue"),
);
const ShareOptions = defineAsyncComponent(
  () => import("../components/modals/contents/ShareOptions.vue"),
);

import { useShare } from "./useShare.js";
import { useNotifications } from "./useNotifications.js";
import { useModalStore } from "../stores/modalStore.js";
import { messages } from "../locales/ja.js";

export function useAppModals(options) {
  const uiStore = useUiStore();
  const { showModal } = useModal();
  const {
    dataManager,
    loadCharacterById,
    saveCharacterToDrive,
    handleSignInClick,
    handleSignOutClick,
    refreshHubList,
    saveNewCharacter,
    saveData,
    handleFileUpload,
    outputToCocofolia,
    printCharacterSheet,
    promptForDriveFolder,
    copyEditCallback,
  } = options;

  async function openHub() {
    await showModal({
      component: CharacterHub,
      title: messages.ui.modal.hubTitle,
      props: {
        dataManager,
        loadCharacter: loadCharacterById,
        saveToDrive: saveCharacterToDrive,
      },
      globalActions: {
        component: CharacterHubControls,
        on: {
          "sign-in": handleSignInClick,
          "sign-out": handleSignOutClick,
          refresh: refreshHubList,
          new: saveNewCharacter,
        },
      },
      buttons: [],
    });
  }

  async function openIoModal() {
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
        driveFolderLabel: messages.ui.modal.io.buttons.driveFolder,
      },
      buttons: [],
      on: {
        "save-local": saveData,
        "load-local": handleFileUpload,
        "output-cocofolia": outputToCocofolia,
        print: printCharacterSheet,
        "drive-folder": promptForDriveFolder,
      },
    });
  }

  async function openShareModal() {
    if (uiStore.isViewingShared) {
      if (typeof copyEditCallback === "function") {
        copyEditCallback();
      }
      return;
    }
    const { generateShare, copyLink, isLongData } = useShare(dataManager);
    const { showToast } = useNotifications();
    const modalStore = useModalStore();
    window.__driveSignIn = handleSignInClick;
    const generateButton = reactive({
      label: messages.ui.modal.generate,
      value: "generate",
      variant: "primary",
      disabled: true,
    });
    function updateCanGenerate(v) {
      generateButton.disabled = !v;
    }
    const result = await showModal({
      component: ShareOptions,
      props: { signedIn: uiStore.isSignedIn, longData: isLongData() },
      title: messages.ui.modal.shareTitle,
      buttons: [
        generateButton,
        {
          label: messages.ui.modal.cancel,
          value: "cancel",
          variant: "secondary",
        },
      ],
      on: { "update:canGenerate": updateCanGenerate },
    });
    delete window.__driveSignIn;
    if (result.value !== "generate" || !result.component) return;
    const optsComp = result.component;
    const opts = {
      type: optsComp.type.value,
      includeFull: optsComp.includeFull.value,
      password: optsComp.password.value || "",
      expiresInDays: Number(optsComp.expires.value) || 0,
    };
    try {
      const link = await generateShare(opts);
      await copyLink(link);
      modalStore.hideModal();
    } catch (err) {
      showToast({
        type: "error",
        title: messages.ui.modal.shareFailed,
        message: err.message,
      });
    }
  }

  return { openHub, openIoModal, openShareModal };
}
