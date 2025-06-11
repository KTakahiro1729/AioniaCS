<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import { importKeyFromString } from './utils/crypto.js';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import CharacterSheetLayout from './layouts/CharacterSheetLayout.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
import ShareDialog from './components/ui/ShareDialog.vue';
// --- Template Refs ---
const mainFooter = ref(null);
const helpPanelRef = ref(null);
const isShareDialogVisible = ref(false);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();

const {
  dataManager,
  outputButtonText,
  saveData,
  handleFileUpload,
  outputToCocofolia,
  generateShareLink,
} = useDataExport(mainFooter);

const {
  canSignInToGoogle,
  canOperateDrive,
  handleSignInClick,
  handleSignOutClick,
  promptForDriveFolder,
  handleSaveToDriveClick,
  handleLoadFromDriveClick,
} = useGoogleDrive(dataManager);

const {
  helpState,
  isHelpVisible,
  handleHelpIconMouseOver,
  handleHelpIconMouseLeave,
  handleHelpIconClick,
  closeHelpPanel,
} = useHelp(helpPanelRef, mainFooter);


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
onMounted(async () => {
  const url = new URL(window.location.href);
  if (url.pathname === '/s' && url.searchParams.get('fileId')) {
    const fileId = url.searchParams.get('fileId');
    const expires = Number(url.searchParams.get('expires')) || 0;
    const keyFragment = url.hash.slice(1);
    if (!keyFragment) {
      console.error('Share key missing in URL');
      return;
    }
    if (expires && Date.now() > expires) {
      console.error('Share link expired');
      return;
    }
    try {
      const key = await importKeyFromString(keyFragment);
      const content = await dataManager.googleDriveManager.loadFileContent(
        fileId,
      );
      if (!content) {
        console.error('Failed to load shared file');
        return;
      }
      const { ciphertext, iv } = JSON.parse(content);
      const encrypted = {
        ciphertext: Buffer.from(ciphertext, 'base64'),
        iv: Uint8Array.from(Buffer.from(iv, 'base64')),
      };
      const parsed = await dataManager.parseEncryptedShareableZip(
        encrypted,
        key,
      );
      Object.assign(characterStore.character, parsed.character);
      characterStore.skills.splice(
        0,
        characterStore.skills.length,
        ...parsed.skills,
      );
      characterStore.specialSkills.splice(
        0,
        characterStore.specialSkills.length,
        ...parsed.specialSkills,
      );
      Object.assign(characterStore.equipments, parsed.equipments);
      characterStore.histories.splice(
        0,
        characterStore.histories.length,
        ...parsed.histories,
      );
      uiStore.isViewingShared = true;
    } catch (err) {
      console.error('Error loading shared data:', err);
    }
  }
});
</script>

<template>
  <TopLeftControls
    :is-gapi-initialized="uiStore.isGapiInitialized"
    :is-gis-initialized="uiStore.isGisInitialized"
    :drive-status-message="uiStore.driveStatusMessage"
    :can-sign-in-to-google="canSignInToGoogle"
    :is-signed-in="uiStore.isSignedIn"
    @sign-in="handleSignInClick"
    @sign-out="handleSignOutClick"
    @choose-folder="promptForDriveFolder(true)"
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
    :is-signed-in="uiStore.isSignedIn"
    :can-operate-drive="canOperateDrive"
    :output-button-text="outputButtonText"
    :is-cloud-save-success="uiStore.isCloudSaveSuccess"
    @save="saveData"
    @file-upload="handleFileUpload"
    @save-to-drive="handleSaveToDriveClick"
    @load-from-drive="handleLoadFromDriveClick"
    @output="outputToCocofolia"
    @help-mouseover="handleHelpIconMouseOver"
    @help-mouseleave="handleHelpIconMouseLeave"
    @help-click="handleHelpIconClick"
    @share="isShareDialogVisible = true"
  />
  <HelpPanel
    ref="helpPanelRef"
    :is-visible="isHelpVisible"
    :help-text="AioniaGameData.helpText"
    @close="closeHelpPanel"
  />
  <ShareDialog
    v-if="isShareDialogVisible"
    :generate-share-link="generateShareLink"
    @close="isShareDialogVisible = false"
  />
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
