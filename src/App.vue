<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import { usePrint } from './composables/usePrint.js';
import { messages } from './locales/ja.js';
import { useAppModals } from './composables/useAppModals.js';
import { useAppInitialization } from './composables/useAppInitialization.js';
import { useCloudSync } from './composables/useCloudSync.js';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import MainHeader from './components/ui/MainHeader.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import NotificationContainer from './components/notifications/NotificationContainer.vue';
import BaseModal from './components/modals/BaseModal.vue';
import { useModal } from './composables/useModal.js';
import { useModalStore } from './stores/modalStore.js';
import { useNotifications } from './composables/useNotifications.js';
// --- Template Refs ---
const mainHeader = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();

const { dataManager, saveData, handleFileUpload, outputToCocofolia } = useDataExport();
const { printCharacterSheet, openPreviewPage } = usePrint();

const { handleSignInClick, handleSignOutClick, saveCharacterToCloud, saveOrUpdateCurrentCharacterInCloud } =
  useCloudSync(dataManager);

const { helpState, isHelpVisible, handleHelpIconMouseOver, handleHelpIconMouseLeave, handleHelpIconClick, closeHelpPanel } = useHelp(
  helpPanelRef,
  mainHeader,
);

const { showAsyncToast } = useNotifications();
const { showModal } = useModal();
const modalStore = useModalStore();

async function loadCharacterById(id, characterName) {
  const loadPromise = dataManager.loadDataFromCloud(id).then((parsedData) => {
    if (parsedData) {
      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
      uiStore.currentCloudFileId = id;
    }
  });
  showAsyncToast(loadPromise, {
    loading: messages.cloudStorage.load.loading(characterName),
    success: messages.cloudStorage.load.success(characterName),
    error: (err) => messages.cloudStorage.load.error(err),
  });
}

const { openHub, openIoModal, openShareModal } = useAppModals({
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
  () => characterStore.character.initialScar,
  (newVal) => {
    if (characterStore.character.linkCurrentToInitialScar) {
      characterStore.character.currentScar = newVal;
    }
  },
);

watch(
  () => characterStore.character.linkCurrentToInitialScar,
  (isLinked) => {
    if (isLinked) {
      characterStore.character.currentScar = characterStore.character.initialScar;
    }
  },
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
const { initialize } = useAppInitialization();
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
    :save-to-cloud="saveOrUpdateCurrentCharacterInCloud"
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
@import './assets/css/style.css';

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
