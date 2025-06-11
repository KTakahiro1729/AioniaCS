<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';
import MainFooter from './components/ui/MainFooter.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import CharacterBasicInfo from './components/sections/CharacterBasicInfo.vue';
import ScarWeaknessSection from './components/sections/ScarWeaknessSection.vue';
import SkillsSection from './components/sections/SkillsSection.vue';
import SpecialSkillsSection from './components/sections/SpecialSkillsSection.vue';
import ItemsSection from './components/sections/ItemsSection.vue';
import CharacterMemoSection from './components/sections/CharacterMemoSection.vue';
import AdventureLogSection from './components/sections/AdventureLogSection.vue';
import { manageListItem } from './composables/character/useListManagement.js';
import { useCharacterData } from './composables/character/useCharacterData.js';
import { useSkillsManagement } from './composables/character/useSkillsManagement.js';
import { useExperienceCalculation } from './composables/character/useExperienceCalculation.js';
import { useScarLink } from './composables/character/useScarLink.js';
import { AioniaGameData } from './data/gameData.js';
import { DataManager } from './services/dataManager.js';
import { useCocofoliaOutput } from './composables/character/useCocofoliaOutput.js';
import { useGoogleDrive } from './composables/useGoogleDrive.js';
import { useHelpPanel } from './composables/ui/useHelpPanel.js';
import { useImageManagement } from './composables/ui/useImageManagement.js';
import { useClipboard } from './composables/ui/useClipboard.js';

const isE2ETesting = import.meta.env.VITE_E2E_TESTING === 'true';
if (isE2ETesting) {
  console.log('E2E testing mode');
  window.__E2E_MODE__ = true;
}

const outputButton = ref(null);
const dataManager = ref(null);

const {
  character,
  skills,
  specialSkills,
  equipments,
  histories,
} = useCharacterData();
useScarLink(character);

const {
  addExpert,
  removeExpert,
  addSpecialSkillItem,
  removeSpecialSkill,
  expertPlaceholder,
  availableSpecialSkillNames,
  updateSpecialSkillOptions,
  updateSpecialSkillNoteVisibility,
} = useSkillsManagement(skills, specialSkills);

const {
  maxExperiencePoints,
  currentExperiencePoints,
  currentWeight,
  experienceStatusClass,
} = useExperienceCalculation(character, skills, specialSkills, histories, equipments);

const {
  helpState,
  helpIcon,
  helpPanel,
  handleHelpIconMouseOver,
  handleHelpIconMouseLeave,
  handleHelpIconClick,
  closeHelpPanel,
} = useHelpPanel();

const {
  currentImageIndex,
  currentImageSrc,
  handleImageUpload,
  nextImage,
  previousImage,
  removeCurrentImage,
} = useImageManagement(character, showCustomAlert);

let driveMenuToggleButton;
let driveMenu;
let isSignedIn;
let canSignInToGoogle;
let canOperateDrive;
let showDriveMenu;
let driveStatusMessage;
let isCloudSaveSuccess;
let toggleDriveMenu;
let handleSignInClick;
let handleSignOutClick;
let promptForDriveFolder;
let handleSaveToDriveClick;
let handleLoadFromDriveClick;

if (!isE2ETesting) {
  ({
    driveMenuToggleButton,
    driveMenu,
    isSignedIn,
    canSignInToGoogle,
    canOperateDrive,
    showDriveMenu,
    driveStatusMessage,
    isCloudSaveSuccess,
    toggleDriveMenu,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    handleSaveToDriveClick,
    handleLoadFromDriveClick,
  } = useGoogleDrive(
    character,
    skills,
    specialSkills,
    equipments,
    histories,
    dataManager,
  ));
} else {
  driveMenuToggleButton = ref(null);
  driveMenu = ref(null);
  isSignedIn = ref(false);
  canSignInToGoogle = ref(false);
  canOperateDrive = ref(false);
  showDriveMenu = ref(false);
  driveStatusMessage = ref('');
  isCloudSaveSuccess = ref(false);
  toggleDriveMenu = () => {};
  handleSignInClick = () => {};
  handleSignOutClick = () => {};
  promptForDriveFolder = () => {};
  handleSaveToDriveClick = () => {};
  handleLoadFromDriveClick = () => {};
}

const outputButtonText = ref(AioniaGameData.uiMessages.outputButton.default);
const { copyToClipboard } = useClipboard(outputButtonText, outputButton);

const sessionNamesForWeaknessDropdown = computed(() => {
  const defaultOptions = [...AioniaGameData.weaknessAcquisitionOptions];
  const sessionOptions = histories
    .map((h) => h.sessionName)
    .filter((name) => name && name.trim() !== '')
    .map((name) => ({ value: name, text: name, disabled: false }));
  const helpOption = {
    value: 'help-text',
    text: AioniaGameData.uiMessages.weaknessDropdownHelp,
    disabled: true,
  };
  return defaultOptions.concat(sessionOptions, helpOption);
});



const handleCurrentScarInput = (event) => {
  const enteredValue = parseInt(event.target.value, 10);
  if (isNaN(enteredValue)) {
    if (character.linkCurrentToInitialScar) {
      nextTick(() => {
        character.currentScar = character.initialScar;
      });
    }
    return;
  }
  if (character.linkCurrentToInitialScar) {
    if (enteredValue !== character.initialScar) {
      character.linkCurrentToInitialScar = false;
      character.currentScar = enteredValue;
    }
  }
};



const hasSpecialSkillContent = (ss) => !!(ss.group || ss.name || ss.note);
const hasHistoryContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== "") || h.memo);
const addHistoryItem = () => manageListItem({
  list: histories,
  action: "add",
  newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
});
const removeHistoryItem = (index) => manageListItem({
  list: histories,
  action: "remove",
  index,
  newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
  hasContentChecker: hasHistoryContent,
});
const handleSpeciesChange = () => { if (character.species !== "other") character.rareSpecies = ""; };

const saveData = () => {
  dataManager.value.saveData(character, skills, specialSkills, equipments, histories);
};

const handleFileUpload = (event) => {
  dataManager.value.handleFileUpload(
    event,
    (parsedData) => {
      Object.assign(character, parsedData.character);
      skills.splice(0, skills.length, ...parsedData.skills);
      specialSkills.splice(0, specialSkills.length, ...parsedData.specialSkills);
      Object.assign(equipments, parsedData.equipments);
      histories.splice(0, histories.length, ...parsedData.histories);
    },
    (errorMessage) => showCustomAlert(errorMessage)
  );
};

const { outputToCocofolia } = useCocofoliaOutput(copyToClipboard, currentWeight);
const showCustomAlert = (message) => alert(message);
onMounted(() => {
  dataManager.value = new DataManager(AioniaGameData);
  if (isE2ETesting) {
    document.getElementById('app')?.setAttribute('data-e2e-ready', 'true');
  }
});
</script>

<template>
  <TopLeftControls
    v-if="!isE2ETesting"
    :showDriveMenu="showDriveMenu"
    :driveStatusMessage="driveStatusMessage"
    :canSignInToGoogle="canSignInToGoogle"
    :isSignedIn="isSignedIn"
    @toggleDriveMenu="toggleDriveMenu"
    @signIn="handleSignInClick"
    @signOut="handleSignOutClick"
    @chooseDriveFolder="promptForDriveFolder(true)"
  />
  <div class="main-grid">
    <CharacterBasicInfo
      :character="character"
      :images="character.images"
      :currentImageIndex="currentImageIndex"
      @previousImage="previousImage"
      @nextImage="nextImage"
      @uploadImage="handleImageUpload"
      @deleteImage="removeCurrentImage"
      @speciesChange="handleSpeciesChange"
    />
    <ScarWeaknessSection
      :character="character"
      :sessionNames="sessionNamesForWeaknessDropdown"
      @currentScarInput="handleCurrentScarInput"
    />
    <SkillsSection
      :skills="skills"
      @addExpert="addExpert"
      @removeExpert="removeExpert"
    />
    <SpecialSkillsSection
      :specialSkills="specialSkills"
      @addSpecial="addSpecialSkillItem"
      @removeSpecial="removeSpecialSkill"
      @updateOptions="updateSpecialSkillOptions"
      @updateNote="updateSpecialSkillNoteVisibility"
    />
    <ItemsSection :equipments="equipments" :character="character" />
    <CharacterMemoSection :character="character" />
    <AdventureLogSection
      :histories="histories"
      @addHistory="addHistoryItem"
      @removeHistory="removeHistoryItem"
    />
  </div>
  <div class="copyright-footer">
    <p>
      本サイトは<a href="https://www.aioniatrpg.com/" target="_blank" rel="noopener noreferrer">「イチ（フシギ製作所）」様が権利を有する「慈悲なきアイオニア」</a>の二次創作物です(Ver 1.2対応)。<br />
      本サイトは<a href="https://bright-trpg.github.io/aionia_character_maker/" target="_blank" rel="noopener noreferrer">bright-trpg様作成の「慈悲なきアイオニア　キャラクター作成用ツール」</a>をもとに、あろすてりっくが作成しました。
    </p>
  </div>
  <MainFooter
    :helpState="helpState"
    :experienceStatusClass="experienceStatusClass"
    :currentExperiencePoints="currentExperiencePoints"
    :maxExperiencePoints="maxExperiencePoints"
    :currentWeight="currentWeight"
    :isSignedIn="isSignedIn"
    :canOperateDrive="canOperateDrive"
    :outputButtonText="outputButtonText"
    :isCloudSaveSuccess="isCloudSaveSuccess"
    @saveData="saveData"
    @saveToDrive="handleSaveToDriveClick"
    @fileUpload="handleFileUpload"
    @loadFromDrive="handleLoadFromDriveClick"
    @output="outputToCocofolia"
    @helpOver="handleHelpIconMouseOver"
    @helpLeave="handleHelpIconMouseLeave"
    @helpClick="handleHelpIconClick"
    @closeHelp="closeHelpPanel"
  >
    <div v-html="AioniaGameData.helpText"></div>
  </MainFooter>
</template>

<style scoped>
@import './assets/css/style.css';
.hidden {
  display: none !important;
}
</style>
