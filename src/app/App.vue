<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useGoogleDrive } from '@/features/cloud-sync/composables/useGoogleDrive.js';
import { useHelp } from '@/shared/composables/useHelp.js';
import { useDataExport } from '@/features/character-sheet/composables/useDataExport.js';
import { useLocalCharacterPersistence } from '@/features/character-sheet/composables/useLocalCharacterPersistence.js';
import { useKeyboardHandling } from '@/shared/composables/useKeyboardHandling.js';
import { usePrint } from '@/features/character-sheet/composables/usePrint.js';
import { messages } from '@/locales/ja.js';
import { useAppModals } from '@/features/modals/composables/useAppModals.js';
import { useAppInitialization } from '@/app/providers/useAppInitialization.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import { buildSnapshotFromStore } from '@/features/character-sheet/utils/characterSnapshot.js';

import { AioniaGameData } from '@/data/gameData.js';
import CharacterSheetLayout from '@/features/character-sheet/components/CharacterSheetLayout.vue';
import MainHeader from '@/features/character-sheet/components/ui/MainHeader.vue';
import MainFooter from '@/features/character-sheet/components/ui/MainFooter.vue';
import HelpPanel from '@/features/character-sheet/components/ui/HelpPanel.vue';
import NotificationContainer from '@/features/notifications/components/NotificationContainer.vue';
import BaseModal from '@/features/modals/components/BaseModal.vue';
import { useModalStore } from '@/features/modals/stores/modalStore.js';
const mainHeader = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
uiStore.setLastSavedSnapshot(buildSnapshotFromStore(characterStore));
const { clearLocalDraft } = useLocalCharacterPersistence(characterStore, uiStore);
useKeyboardHandling();

const { dataManager, saveData, handleFileUpload, outputToCocofolia, getChatPaletteText } = useDataExport();
const { printCharacterSheet, openPreviewPage } = usePrint();
const { showModal } = useModal();

const {
  canSignInToGoogle,
  isDriveReady,
  handleSignInClick,
  handleSignOutClick,
  saveCharacterToDrive,
  saveOrUpdateCurrentCharacterInDrive,
  loadCharacterFromDrive,
  promptForDriveFolder,
  updateDriveFolderPath,
} = useGoogleDrive(dataManager);

const { helpState, isHelpVisible, handleHelpIconMouseOver, handleHelpIconMouseLeave, handleHelpIconClick, closeHelpPanel } = useHelp(
  helpPanelRef,
  mainHeader,
);

const modalStore = useModalStore();

function hasUnsavedChanges() {
  const currentSnapshot = buildSnapshotFromStore(characterStore);
  if (!currentSnapshot) {
    return false;
  }
  return uiStore.lastSavedSnapshot ? currentSnapshot !== uiStore.lastSavedSnapshot : true;
}

async function confirmDiscardingUnsavedChanges() {
  if (!hasUnsavedChanges()) {
    return true;
  }
  const result = await showModal(messages.ui.confirmations.unsavedChanges);
  return result?.value === 'confirm';
}

const handleCreateNewCharacter = async (payload) => {
  if (hasUnsavedChanges()) {
    const result = await showModal(messages.ui.confirmations.unsavedChanges);
    const choice = result?.value;

    if (choice === 'save') {
      const saved = await saveOrUpdateCurrentCharacterInDrive();
      if (!saved) {
        return;
      }
    } else if (choice === 'discard') {
      // 「保存せず続行」: 何もしない
    } else {
      // 「キャンセル」またはモーダルを閉じた場合: 中断
      return;
    }
  }
  clearLocalDraft();
  characterStore.initializeAll();
  uiStore.clearCurrentDriveFileId();
  uiStore.isViewingShared = false;
  uiStore.setLastSavedSnapshot(buildSnapshotFromStore(characterStore));
  const shouldCreateCloudFile = payload?.isSignedIn ?? uiStore.isSignedIn;
  if (!shouldCreateCloudFile) {
    return;
  }
  try {
    const result = await saveCharacterToDrive(true);
    if (result?.id) {
      uiStore.setCurrentDriveFileId(result.id);
    }
  } catch (error) {
    console.error('Failed to create Drive file for new character:', error);
  }
};

const { openLoadModal, openIoModal, openShareModal } = useAppModals({
  dataManager,
  handleSignInClick,
  saveData,
  handleFileUpload,
  outputToCocofolia,
  getChatPaletteText,
  printCharacterSheet,
  openPreviewPage,
  copyEditCallback: () => {
    uiStore.isViewingShared = false;
  },
  loadCharacterFromDrive,
  promptForDriveFolder,
  updateDriveFolderPath,
  canSignInToGoogle,
  isDriveReady,
});

const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);

watch(
  () => characterStore.calculatedScar,
  (currentScar) => {
    characterStore.character.currentScar = currentScar;
  },
  { immediate: true },
);

const baseDocumentTitle = messages.ui.header.defaultTitle;

watch(
  () => characterStore.character.name,
  (name) => {
    document.title = name ? `${name} | ${baseDocumentTitle}` : baseDocumentTitle;
  },
  { immediate: true },
);

watch(
  () => modalStore.isVisible,
  (isVisible) => {
    if (isVisible) {
      document.body.classList.add('is-modal-open');
    } else {
      document.body.classList.remove('is-modal-open');
    }
  },
);

const { initialize } = useAppInitialization(dataManager);
onMounted(initialize);
</script>

<template>
  <MainHeader
    ref="mainHeader"
    :help-state="helpState"
    :default-title="messages.ui.header.defaultTitle"
    :help-label="messages.ui.header.helpLabel"
    :new-character-label="messages.ui.header.newCharacter"
    :sign-in-label="messages.ui.header.signIn"
    :sign-out-label="messages.ui.header.signOut"
    @new-character="handleCreateNewCharacter"
    @sign-in="handleSignInClick"
    @sign-out="handleSignOutClick"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
  />
  <div v-if="uiStore.isViewingShared" class="view-mode-banner">
    {{ messages.ui.viewModeBanner }}
  </div>
  <CharacterSheetLayout />
  <MainFooter
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :save-to-drive="saveOrUpdateCurrentCharacterInDrive"
    :experience-label="messages.ui.footer.experience"
    :output-label="messages.ui.footer.output"
    :share-label="messages.ui.footer.share"
    :copy-edit-label="messages.ui.footer.copyEdit"
    :load-label="messages.ui.buttons.loadLocal"
    :save-label="messages.ui.buttons.save"
    :is-viewing-shared="uiStore.isViewingShared"
    @open-load-modal="openLoadModal"
    @open-output-modal="openIoModal"
    @share="openShareModal"
  />
  <HelpPanel ref="helpPanelRef" :is-visible="isHelpVisible" :help-text="AioniaGameData.helpText" @close="closeHelpPanel" />
  <BaseModal />
  <NotificationContainer />
</template>

<style scoped>
.view-mode-banner {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
}
</style>
