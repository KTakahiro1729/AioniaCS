<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import { usePrint } from './composables/usePrint.js';
import { messages } from './locales/ja.js';
import { useAppModals } from './composables/useAppModals.js';
import { useAppInitialization } from './composables/useAppInitialization.js';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import MainHeader from './components/ui/MainHeader.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import NotificationContainer from './components/notifications/NotificationContainer.vue';
import BaseModal from './components/modals/BaseModal.vue';
import { useModalStore } from './stores/modalStore.js';
// --- Template Refs ---
const mainHeader = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();

const { dataManager, saveData, handleFileUpload, outputToCocofolia } = useDataExport();
const { printCharacterSheet, openPreviewPage } = usePrint();

const {
  canSignInToGoogle,
  handleSignInClick,
  handleSignOutClick,
  saveCharacterToDrive,
  saveOrUpdateCurrentCharacterInDrive,
} = useGoogleDrive(dataManager);

const { helpState, isHelpVisible, handleHelpIconMouseOver, handleHelpIconMouseLeave, handleHelpIconClick, closeHelpPanel } = useHelp(
  helpPanelRef,
  mainHeader,
);

const modalStore = useModalStore();

const { openHub, openIoModal, openShareModal } = useAppModals({
  dataManager,
  saveCharacterToDrive,
  handleSignInClick,
  handleSignOutClick,
  saveData,
  handleFileUpload,
  outputToCocofolia,
  printCharacterSheet,
  openPreviewPage,
  copyEditCallback: () => {
    uiStore.isViewingShared = false;
  },
});

// --- Computed Properties (formerly `computed`) ---

const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);

// --- Watchers (formerly `watch`) ---

watch(
  () => characterStore.calculatedScar,
  (currentScar) => {
    characterStore.character.currentScar = currentScar;
  },
  { immediate: true },
);

watch(
  () => characterStore.character.name,
  (name) => {
    document.title = name || messages.ui.header.defaultTitle;
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

// --- Lifecycle Hooks ---
const { initialize } = useAppInitialization(dataManager);
onMounted(initialize);
</script>

<template>
  <MainHeader
    ref="mainHeader"
    :help-state="helpState"
    :default-title="messages.ui.header.defaultTitle"
    :cloud-hub-label="messages.ui.header.cloudHub"
    :help-label="messages.ui.header.helpLabel"
    @open-hub="openHub"
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
    :save-local="saveData"
    :handle-file-upload="handleFileUpload"
    :open-hub="openHub"
    :save-to-drive="saveOrUpdateCurrentCharacterInDrive"
    :experience-label="messages.ui.footer.experience"
    :io-label="messages.ui.footer.io"
    :share-label="messages.ui.footer.share"
    :copy-edit-label="messages.ui.footer.copyEdit"
    :is-viewing-shared="uiStore.isViewingShared"
    @io="openIoModal"
    @share="openShareModal"
  />
  <HelpPanel ref="helpPanelRef" :is-visible="isHelpVisible" :help-text="AioniaGameData.helpText" @close="closeHelpPanel" />
  <!-- CharacterHub and ShareModal are now injected via BaseModal -->
  <BaseModal />
  <NotificationContainer />
</template>

<style scoped>
/*
  It is recommended to use Vite's asset handling.
  You can either @import your main CSS file here or manage it
  in your main.js/main.ts entry file.
*/

/* Additional component-specific styles can go here */
.hidden {
  display: none !important;
}
.view-mode-banner {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 0.5rem;
}
</style>
