<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useCharacterStore } from "./stores/characterStore.js";
import { useUiStore } from "./stores/uiStore.js";
import { useGoogleDrive } from "./composables/useGoogleDrive.js";
import { useHelp } from "./composables/useHelp.js";
import { useDataExport } from "./composables/useDataExport.js";
import { useKeyboardHandling } from "./composables/useKeyboardHandling.js";
import { usePrint } from "./composables/usePrint.js";
import { useAppInitialization } from "./composables/useAppInitialization.js";
import { messages } from "./locales/ja.js";

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import NotificationContainer from './components/notifications/NotificationContainer.vue';
import BaseModal from './components/modals/BaseModal.vue';
import CharacterHub from './components/ui/CharacterHub.vue';
import CharacterHubControls from './components/ui/CharacterHubControls.vue';
import ShareOptions from './components/modals/contents/ShareOptions.vue';
import { useModal } from './composables/useModal.js';
import { useNotifications } from './composables/useNotifications.js';
// --- Template Refs ---
const mainFooter = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();
const { printCharacterSheet, openPreviewPage  } = usePrint();

const {
  dataManager,
  outputButtonText,
  saveData,
  handleFileUpload,
  outputToCocofolia,
} = useDataExport(mainFooter);


const {
  canSignInToGoogle,
  handleSignInClick,
  handleSignOutClick,
  promptForDriveFolder,
  saveCharacterToDrive,
} = useGoogleDrive(dataManager);

const {
  helpState,
  isHelpVisible,
  handleHelpIconMouseOver,
  handleHelpIconMouseLeave,
  handleHelpIconClick,
  closeHelpPanel,
} = useHelp(helpPanelRef, mainFooter);

const { showAsyncToast } = useNotifications();
const { showModal } = useModal();

async function openHub() {
  await showModal({
    component: CharacterHub,
    title: 'クラウドキャラクター管理',
    props: {
      dataManager,
      loadCharacter: loadCharacterById,
      saveToDrive: saveCharacterToDrive,
    },
    globalActions: {
      component: CharacterHubControls,
      on: {
        'sign-in': handleSignInClick,
        'sign-out': handleSignOutClick,
        refresh: refreshHubList,
        new: saveNewCharacter,
      },
    },
    buttons: [],
  });
}

function refreshHubList() {
  uiStore.refreshDriveCharacters(dataManager.googleDriveManager);
}

async function saveNewCharacter() {
  await saveCharacterToDrive(null, characterStore.character.name);
}


async function loadCharacterById(id, name) {
  const loadPromise = dataManager
    .loadDataFromDrive(id)
    .then((parsedData) => {
      if (parsedData) {
        Object.assign(characterStore.character, parsedData.character);
        characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
        characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
        Object.assign(characterStore.equipments, parsedData.equipments);
        characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
        uiStore.currentDriveFileId = id;
        uiStore.currentDriveFileName = name;
      }
    });
  showAsyncToast(loadPromise, {
    loading: messages.googleDrive.load.loading(name),
    success: messages.googleDrive.load.success(name),
    error: (err) => messages.googleDrive.load.error(err),
  });
}



// --- Computed Properties (formerly `computed`) ---

const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);



// --- Watchers (formerly `watch`) ---


watch(() => characterStore.character.initialScar, (newVal) => {
  if (characterStore.character.linkCurrentToInitialScar) {
    characterStore.character.currentScar = newVal;
  }
});

watch(() => characterStore.character.linkCurrentToInitialScar, (isLinked) => {
  if (isLinked) {
    characterStore.character.currentScar = characterStore.character.initialScar;
  }
});

// --- Lifecycle Hooks ---
const { initialize } = useAppInitialization(dataManager);
onMounted(() => {
  initialize();
});
</script>

<template>
  <TopLeftControls
    :is-gapi-initialized="uiStore.isGapiInitialized"
    :is-gis-initialized="uiStore.isGisInitialized"
    @open-hub="openHub"
  />
  <div v-if="uiStore.isViewingShared" class="view-mode-banner">閲覧モードで表示中</div>
  <CharacterSheetLayout />
  <MainFooter
    ref="mainFooter"
    :help-state="helpState"
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :output-button-text="outputButtonText"
    :data-manager="dataManager"
    :sign-in="handleSignInClick"
    :is-viewing-shared="uiStore.isViewingShared"
    @save="saveData"
    @file-upload="handleFileUpload"
    @output="outputToCocofolia"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
    @copy-edit="uiStore.isViewingShared = false"
    @print="printCharacterSheet"
  />
  <HelpPanel
    ref="helpPanelRef"
    :is-visible="isHelpVisible"
    :help-text="AioniaGameData.helpText"
    @close="closeHelpPanel"
  />
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
