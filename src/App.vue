<script setup>
import { ref, computed, watch } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelp } from './composables/useHelp.js';
import { useDataExport } from './composables/useDataExport.js';
import { useKeyboardHandling } from './composables/useKeyboardHandling.js';
import AdventureLogSection from './components/sections/AdventureLogSection.vue';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import ScarWeaknessSection from './components/sections/ScarWeaknessSection.vue';
import CharacterBasicInfo from './components/sections/CharacterBasicInfo.vue';
import SkillsSection from './components/sections/SkillsSection.vue';
import ItemsSection from './components/sections/ItemsSection.vue';
import CharacterMemoSection from './components/sections/CharacterMemoSection.vue';

import SpecialSkillsSection from './components/sections/SpecialSkillsSection.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
// --- Template Refs ---
const mainFooter = ref(null);
const helpPanelRef = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
useKeyboardHandling();

const {
  dataManager,
  outputButtonText,
  saveData,
  handleFileUpload,
  outputToCocofolia,
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
const sessionNamesForWeaknessDropdown = computed(() => characterStore.sessionNamesForWeaknessDropdown);



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
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="main-grid">
    <CharacterBasicInfo v-model:character="characterStore.character" />

    <ScarWeaknessSection
      v-model:character="characterStore.character"
      :session-names="sessionNamesForWeaknessDropdown"
    />

    <SkillsSection v-model:skills="characterStore.skills" />
    <SpecialSkillsSection v-model:specialSkills="characterStore.specialSkills" />
    <ItemsSection
      v-model:equipments="characterStore.equipments"
      v-model:otherItems="characterStore.character.otherItems"
    />
    <CharacterMemoSection v-model="characterStore.character.memo" />
    <AdventureLogSection
      :histories="characterStore.histories"
      @add-item="characterStore.addHistoryItem()"
      @remove-item="characterStore.removeHistoryItem"
      @update:history="characterStore.updateHistoryItem"
    />
  </div>
  <div class="copyright-footer">
    <p>
      本サイトは<a href="https://www.aioniatrpg.com/" target="_blank" rel="noopener noreferrer">「イチ（フシギ製作所）」様が権利を有する「慈悲なきアイオニア」</a>の二次創作物です(Ver 1.2対応)。<br />
      本サイトは<a href="https://bright-trpg.github.io/aionia_character_maker/" target="_blank" rel="noopener noreferrer">bright-trpg様作成の「慈悲なきアイオニア　キャラクター作成用ツール」</a>をもとに、あろすてりっくが作成しました。
    </p>
  </div>
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
  />
  <HelpPanel
    ref="helpPanelRef"
    :is-visible="isHelpVisible"
    :help-text="AioniaGameData.helpText"
    @close="closeHelpPanel"
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
</style>
