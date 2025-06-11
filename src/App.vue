<script setup>
import { ref, watch, computed } from 'vue';
import { AioniaGameData } from './data/gameData.js';
import { useCharacterData } from './composables/character/useCharacterData.js';
import { useListManagement } from './composables/character/useListManagement.js';
import { useSkillsManagement } from './composables/character/useSkillsManagement.js';
import { useExperienceCalculation } from './composables/character/useExperienceCalculation.js';
import { useImageManagement } from './composables/character/useImageManagement.js';
import { useDriveManagement } from './composables/character/useDriveManagement.js';
import { useHelpPanel } from './composables/ui/useHelpPanel.js';
import { useOutput } from './composables/character/useOutput.js';
import CharacterBasicInfo from './components/sections/CharacterBasicInfo.vue';
import ScarWeaknessSection from './components/sections/ScarWeaknessSection.vue';
import SkillsSection from './components/sections/SkillsSection.vue';
import SpecialSkillsSection from './components/sections/SpecialSkillsSection.vue';
import ItemsSection from './components/sections/ItemsSection.vue';
import CharacterMemoSection from './components/sections/CharacterMemoSection.vue';
import AdventureLogSection from './components/sections/AdventureLogSection.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';

const driveMenuToggleButton = ref(null);
const driveMenu = ref(null);
const helpIcon = ref(null);
const helpPanel = ref(null);
const outputButton = ref(null);

const { character, skills, specialSkills, equipments, histories } = useCharacterData();
const { addExpert, removeExpert } = useSkillsManagement(skills);
const { maxExperiencePoints, currentExperiencePoints, currentWeight } = useExperienceCalculation(
  character,
  skills,
  specialSkills,
  equipments,
  histories,
);
const images = useImageManagement(character);
const drive = useDriveManagement(
  character,
  skills,
  specialSkills,
  equipments,
  histories,
  driveMenuToggleButton,
  driveMenu,
);
const help = useHelpPanel(helpIcon, helpPanel);
const { outputButtonText, outputToCocofolia } = useOutput(outputButton);
const { manageListItem } = useListManagement();

const sessionNamesForWeaknessDropdown = computed(() => {
  const defaultOptions = [...AioniaGameData.weaknessAcquisitionOptions];
  const sessionOptions = histories
    .map((h) => h.sessionName)
    .filter((name) => name && name.trim() !== "")
    .map((name) => ({ value: name, text: name, disabled: false }));
  const helpOption = { value: "help-text", text: AioniaGameData.uiMessages.weaknessDropdownHelp, disabled: true };
  return defaultOptions.concat(sessionOptions, helpOption);
});

const handleCurrentScarInput = (event) => {
  const enteredValue = parseInt(event.target.value, 10);
  if (isNaN(enteredValue)) {
    if (character.linkCurrentToInitialScar) {
      character.currentScar = character.initialScar;
    }
    return;
  }
  if (character.linkCurrentToInitialScar && enteredValue !== character.initialScar) {
    character.linkCurrentToInitialScar = false;
    character.currentScar = enteredValue;
  }
};

const hasSpecialSkillContent = (ss) => !!(ss.group || ss.name || ss.note);
const hasHistoryContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo);

const addSpecialSkillItem = () =>
  manageListItem({
    list: specialSkills,
    action: 'add',
    newItemFactory: () => ({ group: '', name: '', note: '', showNote: false }),
    maxLength: AioniaGameData.config.maxSpecialSkills,
  });

const removeSpecialSkill = (index) =>
  manageListItem({
    list: specialSkills,
    action: 'remove',
    index,
    newItemFactory: () => ({ group: '', name: '', note: '', showNote: false }),
    hasContentChecker: hasSpecialSkillContent,
  });

const addHistoryItem = () =>
  manageListItem({
    list: histories,
    action: 'add',
    newItemFactory: () => ({ sessionName: '', gotExperiments: null, memo: '' }),
  });

const removeHistoryItem = (index) =>
  manageListItem({
    list: histories,
    action: 'remove',
    index,
    newItemFactory: () => ({ sessionName: '', gotExperiments: null, memo: '' }),
    hasContentChecker: hasHistoryContent,
  });

const availableSpecialSkillNames = (index) =>
  specialSkills[index] ? AioniaGameData.specialSkillData[specialSkills[index].group] || [] : [];

const updateSpecialSkillOptions = (index) => {
  if (specialSkills[index]) {
    specialSkills[index].name = '';
    updateSpecialSkillNoteVisibility(index);
  }
};

const updateSpecialSkillNoteVisibility = (index) => {
  if (specialSkills[index]) {
    const skillName = specialSkills[index].name;
    specialSkills[index].showNote = AioniaGameData.specialSkillsRequiringNote.includes(skillName);
  }
};

const saveData = () => {
  drive.dataManager.value.saveData(character, skills, specialSkills, equipments, histories);
};

const handleFileUpload = (event) => {
  drive.dataManager.value.handleFileUpload(
    event,
    (parsedData) => {
      Object.assign(character, parsedData.character);
      skills.splice(0, skills.length, ...parsedData.skills);
      specialSkills.splice(0, specialSkills.length, ...parsedData.specialSkills);
      Object.assign(equipments, parsedData.equipments);
      histories.splice(0, histories.length, ...parsedData.histories);
    },
    (errorMessage) => alert(errorMessage),
  );
};

watch(
  () => character.initialScar,
  (newVal) => {
    if (character.linkCurrentToInitialScar) {
      character.currentScar = newVal;
    }
  },
);

watch(
  () => character.linkCurrentToInitialScar,
  (isLinked) => {
    if (isLinked) {
      character.currentScar = character.initialScar;
    }
  },
);
</script>

<template>
  <TopLeftControls
    :show="drive.showDriveMenu"
    :status-message="drive.driveStatusMessage"
    :can-sign-in="drive.canSignInToGoogle"
    :signed-in="drive.isSignedIn"
    @toggle-drive="drive.toggleDriveMenu"
    @sign-in="drive.handleSignInClick"
    @sign-out="drive.handleSignOutClick"
    @choose-folder="drive.promptForDriveFolder(true)"
  />
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="main-grid">
    <CharacterBasicInfo
      :character="character"
      :current-image-src="images.currentImageSrc.value"
      :current-image-index="images.currentImageIndex.value"
      @upload="images.handleImageUpload"
      @next="images.nextImage"
      @previous="images.previousImage"
      @remove="images.removeCurrentImage"
    />

    <ScarWeaknessSection
      :character="character"
      :dropdown-options="sessionNamesForWeaknessDropdown"
      @current-scar="handleCurrentScarInput"
    />

    <SkillsSection :skills="skills" @add-expert="addExpert" @remove-expert="removeExpert" />

    <SpecialSkillsSection
      :special-skills="specialSkills"
      :group-options="AioniaGameData.specialSkillGroupOptions"
      :name-options="availableSpecialSkillNames"
      :max="AioniaGameData.config.maxSpecialSkills"
      note-placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
      @add="addSpecialSkillItem"
      @remove="removeSpecialSkill"
      @update-group="updateSpecialSkillOptions"
      @update-name="updateSpecialSkillNoteVisibility"
    />
    <ItemsSection
      :equipments="equipments"
      :character="character"
      :weapon-options="AioniaGameData.weaponOptions"
      :armor-options="AioniaGameData.armorOptions"
      weapon-placeholder="AioniaGameData.placeholderTexts.weaponName"
      armor-placeholder="AioniaGameData.placeholderTexts.armorName"
    />
    <CharacterMemoSection :character="character" :placeholder="AioniaGameData.placeholderTexts.characterMemo" />
    <AdventureLogSection :histories="histories" @add="addHistoryItem" @remove="removeHistoryItem" />
  </div>
  <div class="copyright-footer">
    <p>
      本サイトは<a href="https://www.aioniatrpg.com/" target="_blank" rel="noopener noreferrer">「イチ（フシギ製作所）」様が権利を有する「慈悲なきアイオニア」</a>の二次創作物です(Ver 1.2対応)。<br />
      本サイトは<a href="https://bright-trpg.github.io/aionia_character_maker/" target="_blank" rel="noopener noreferrer">bright-trpg様作成の「慈悲なきアイオニア　キャラクター作成用ツール」</a>をもとに、あろすてりっくが作成しました。
    </p>
  </div>
  <div class="main-footer">
    <div
      class="button-base footer-help-icon"
      ref="helpIcon"
      :class="{ 'footer-help-icon--fixed': help.helpState === 'fixed' }"
      @mouseover="help.handleMouseOver"
      @mouseleave="help.handleMouseLeave"
      @click="help.handleClick"
      tabindex="0"
    >
      ？
    </div>
    <div :class="['status-display', currentExperiencePoints > maxExperiencePoints ? 'status-display--experience-over' : 'status-display--experience-ok']">
      経験点 {{ currentExperiencePoints }} / {{ maxExperiencePoints }}
    </div>
    <div class="status-display status-display--weight">荷重: {{ currentWeight }}</div>
    <MainFooter
      :signed-in="drive.isSignedIn"
      :can-operate="drive.canOperateDrive"
      :cloud-success="drive.isCloudSaveSuccess"
      @save="saveData"
      @cloud-save="drive.handleSaveToDriveClick"
      @load="handleFileUpload"
      @cloud-load="drive.handleLoadFromDriveClick"
      @cocofolia="outputToCocofolia(character, skills, specialSkills, equipments, histories)"
    >
      <template #output-text>{{ outputButtonText }}</template>
    </MainFooter>
    <HelpPanel :visible="help.isHelpVisible" :help-text="AioniaGameData.helpText" @close="help.closePanel" />
  </div>
</template>

<style scoped>
@import './assets/css/style.css';
.hidden {
  display: none !important;
}
</style>
