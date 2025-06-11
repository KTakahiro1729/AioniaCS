<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import AdventureLogSection from './components/sections/AdventureLogSection.vue';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import { DataManager } from './services/dataManager.js';
import { CocofoliaExporter } from './services/cocofoliaExporter.js';
import { GoogleDriveManager } from './services/googleDriveManager.js';
import { deepClone, createWeaknessArray } from './utils/utils.js';
import ScarWeaknessSection from './components/sections/ScarWeaknessSection.vue';
import { useWeaknessManagement } from './composables/features/useWeaknessManagement.js';
import CharacterBasicInfo from './components/sections/CharacterBasicInfo.vue';
import SkillsSection from './components/sections/SkillsSection.vue';
import ItemsSection from './components/sections/ItemsSection.vue';
import { useEquipmentManagement } from './composables/features/useEquipmentManagement.js';
import CharacterMemoSection from './components/sections/CharacterMemoSection.vue';

import SpecialSkillsSection from './components/sections/SpecialSkillsSection.vue';
import TopLeftControls from './components/ui/TopLeftControls.vue';
import MainFooter from './components/ui/MainFooter.vue';
import HelpPanel from './components/ui/HelpPanel.vue';
// --- Template Refs ---
const mainFooter = ref(null);
const helpPanelRef = ref(null);

// --- Reactive State (formerly `data`) ---

// Service instances are wrapped in ref() to be assigned later in onMounted.
const dataManager = ref(null);
const cocofoliaExporter = ref(null);
const googleDriveManager = ref(null);

// Main character data object, deeply reactive using `reactive()`.
const character = reactive(
  (() => {
    const baseChar = deepClone(AioniaGameData.defaultCharacterData);
    baseChar.weaknesses = createWeaknessArray(AioniaGameData.config.maxWeaknesses);
    return baseChar;
  })()
);

// Other primary data structures.
const skills = reactive(deepClone(AioniaGameData.baseSkills));
const specialSkills = reactive(
  Array(AioniaGameData.config.initialSpecialSkillCount)
    .fill(null)
    .map(() => ({ group: '', name: '', note: '', showNote: false }))
);
const equipments = reactive({
  weapon1: { group: '', name: '' },
  weapon2: { group: '', name: '' },
  armor: { group: '', name: '' },
});
const histories = reactive([{ sessionName: '', gotExperiments: null, memo: '' }]);

// UI state refs. Primitive values are wrapped in `ref()`.
const outputButtonText = ref(AioniaGameData.uiMessages.outputButton.default);
const helpState = ref('closed'); // 'closed', 'hovered', 'fixed'
const isDesktop = ref(false);
const isCloudSaveSuccess = ref(false);

// Google Drive related state.
const isSignedIn = ref(false);
const googleUser = ref(null);
const driveFolderId = ref(null);
const driveFolderName = ref('');
const currentDriveFileId = ref(null);
const currentDriveFileName = ref('');
const driveStatusMessage = ref('');
const isGapiInitialized = ref(false);
const isGisInitialized = ref(false);


// --- Computed Properties (formerly `computed`) ---

const isHelpVisible = computed(() => helpState.value !== 'closed');

const maxExperiencePoints = computed(() => {
  const initialScarExp = Number(character.initialScar) || 0;
  const creationWeaknessExp = character.weaknesses.reduce(
    (sum, weakness) =>
      sum +
      (weakness.text && weakness.text.trim() !== '' && weakness.acquired === '作成時'
        ? AioniaGameData.experiencePointValues.weakness
        : 0),
    0
  );
  const combinedInitialBonus = Math.min(
    initialScarExp + creationWeaknessExp,
    AioniaGameData.experiencePointValues.maxInitialBonus
  );
  const historyExp = histories.reduce((sum, h) => sum + (Number(h.gotExperiments) || 0), 0);
  return AioniaGameData.experiencePointValues.basePoints + combinedInitialBonus + historyExp;
});

const currentExperiencePoints = computed(() => {
  const skillExp = skills.reduce(
    (sum, s) => sum + (s.checked ? AioniaGameData.experiencePointValues.skillBase : 0),
    0
  );
  const expertExp = skills.reduce((sum, s) => {
    if (s.checked && s.canHaveExperts) {
      return (
        sum +
        s.experts.reduce(
          (expSum, exp) =>
            expSum +
            (exp.value && exp.value.trim() !== ''
              ? AioniaGameData.experiencePointValues.expertSkill
              : 0),
          0
        )
      );
    }
    return sum;
  }, 0);
  const specialSkillExp = specialSkills.reduce(
    (sum, ss) =>
      sum + (ss.name && ss.name.trim() !== '' ? AioniaGameData.experiencePointValues.specialSkill : 0),
    0
  );
  return skillExp + expertExp + specialSkillExp;
});

const { currentWeight } = useEquipmentManagement(ref(equipments));

const experienceStatusClass = computed(() =>
  currentExperiencePoints.value > maxExperiencePoints.value
    ? 'status-display--experience-over'
    : 'status-display--experience-ok'
);

const { sessionNamesForWeaknessDropdown } = useWeaknessManagement(ref(histories));

const canSignInToGoogle = computed(() => isGapiInitialized.value && isGisInitialized.value && !isSignedIn.value);
const canOperateDrive = computed(() => isSignedIn.value && driveFolderId.value);


// --- Methods (formerly `methods`) ---



const handleHelpIconMouseOver = () => {
  if (isDesktop.value && helpState.value === "closed") {
    helpState.value = "hovered";
  }
};

const handleHelpIconMouseLeave = () => {
  if (isDesktop.value && helpState.value === "hovered") {
    helpState.value = "closed";
  }
};

const handleHelpIconClick = () => {
  if (isDesktop.value) {
    helpState.value = helpState.value === "fixed" ? "closed" : "fixed";
  } else {
    helpState.value = helpState.value === "closed" ? "fixed" : "closed";
  }
};

const closeHelpPanel = () => {
  helpState.value = "closed";
};

const _manageListItem = ({ list, action, index, newItemFactory, hasContentChecker, maxLength }) => {
  if (action === "add") {
    if (maxLength && list.length >= maxLength) return;
    const newItem = typeof newItemFactory === "function" ? newItemFactory() : newItemFactory;
    list.push(typeof newItem === 'object' && newItem !== null ? deepClone(newItem) : newItem);
  } else if (action === "remove") {
    if (list.length > 1) {
      list.splice(index, 1);
    } else if (list.length === 1 && hasContentChecker && hasContentChecker(list[index])) {
      const emptyItem = typeof newItemFactory === "function" ? newItemFactory() : newItemFactory;
      list[index] = typeof emptyItem === 'object' && emptyItem !== null ? deepClone(emptyItem) : emptyItem;
    }
  }
};

const hasSpecialSkillContent = (ss) => !!(ss.group || ss.name || ss.note);
const hasHistoryContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== "") || h.memo);

const addSpecialSkillItem = () => _manageListItem({
  list: specialSkills,
  action: "add",
  newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
  maxLength: AioniaGameData.config.maxSpecialSkills,
});
const removeSpecialSkill = (index) => _manageListItem({
  list: specialSkills,
  action: "remove",
  index,
  newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
  hasContentChecker: hasSpecialSkillContent,
});
const addHistoryItem = () => _manageListItem({
  list: histories,
  action: "add",
  newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
});
const removeHistoryItem = (index) => _manageListItem({
  list: histories,
  action: "remove",
  index,
  newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
  hasContentChecker: hasHistoryContent,
});
const updateHistoryItem = (index, field, value) => {
  if (histories[index]) {
    histories[index][field] = field === 'gotExperiments' && value !== '' && value !== null ? Number(value) : value;
  }
};

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

const outputToCocofolia = () => {
  const exportData = {
    character,
    skills,
    specialSkills,
    equipments,
    currentWeight: currentWeight.value,
    speciesLabelMap: AioniaGameData.speciesLabelMap,
    equipmentGroupLabelMap: AioniaGameData.equipmentGroupLabelMap,
    specialSkillData: AioniaGameData.specialSkillData,
    specialSkillsRequiringNote: AioniaGameData.specialSkillsRequiringNote,
    weaponDamage: AioniaGameData.weaponDamage,
  };
  const cocofoliaCharacter = cocofoliaExporter.value.generateCocofoliaData(exportData);
  const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
  copyToClipboard(textToCopy);
};

const copyToClipboard = async (text) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    playOutputAnimation();
  } catch (err) {
    console.error("Failed to copy: ", err);
    fallbackCopyTextToClipboard(text);
  }
};

const fallbackCopyTextToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.cssText = "position: fixed; top: 0; left: 0; opacity: 0;";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand("copy");
    if (successful) {
      playOutputAnimation();
    } else {
      outputButtonText.value = AioniaGameData.uiMessages.outputButton.failed;
      setTimeout(() => {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.default;
      }, 3000);
    }
  } catch (err) {
    console.error(err);
    outputButtonText.value = AioniaGameData.uiMessages.outputButton.error;
    setTimeout(() => {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.default;
    }, 3000);
  }
  document.body.removeChild(textArea);
};

const playOutputAnimation = () => {
  const button = mainFooter.value?.outputButton;
  if (!button || button.classList.contains("is-animating")) return;
  
  const buttonMessages = AioniaGameData.uiMessages.outputButton;
  const timings = buttonMessages.animationTimings;
  
  button.classList.add("is-animating", "state-1");
  
  setTimeout(() => {
    button.classList.remove("state-1");
    outputButtonText.value = buttonMessages.animating;
    button.classList.add("state-2");
  }, timings.state1_bgFill);
  
  setTimeout(() => {
    button.classList.remove("state-2");
    button.classList.add("state-3");
  }, timings.state1_bgFill + timings.state2_textHold);
  
  setTimeout(() => {
    button.classList.remove("state-3");
    outputButtonText.value = buttonMessages.default;
    button.classList.add("state-4");
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut);
  
  setTimeout(() => {
    button.classList.remove("is-animating", "state-4");
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut + timings.state4_bgReset);
};

const showCustomAlert = (message) => alert(message);


const _checkDriveReadiness = (actionContext = "operate") => {
  if (!googleDriveManager.value) {
    driveStatusMessage.value = "Error: Drive Manager is not available.";
    return false;
  }
  if (!isSignedIn.value && actionContext !== "sign in") {
    driveStatusMessage.value = `Error: Please sign in to ${actionContext}.`;
    return false;
  }
  return true;
};

const handleSignInClick = () => {
  if (!googleDriveManager.value) {
      driveStatusMessage.value = "Error: Drive Manager not available.";
      return;
  }
  driveStatusMessage.value = "Signing in... Please wait.";
  try {
    googleDriveManager.value.handleSignIn((error, authResult) => {
      if (error || !authResult || !authResult.signedIn) {
        isSignedIn.value = false;
        googleUser.value = null;
        driveStatusMessage.value = "Sign-in failed. " + (error ? error.message || error.details || "Please try again." : "Ensure pop-ups are enabled.");
      } else {
        isSignedIn.value = true;
        googleUser.value = { displayName: "User" }; // Placeholder
        driveStatusMessage.value = `Signed in. Folder: ${driveFolderName.value || "Not selected"}`;
        if (!driveFolderId.value) {
          getOrPromptForDriveFolder();
        }
      }
    });
  } catch (err) {
    isSignedIn.value = false;
    googleUser.value = null;
    driveStatusMessage.value = "Sign-in error: " + (err.message || "An unexpected error occurred.");
  }
};

const handleSignOutClick = () => {
  if (!_checkDriveReadiness("sign out")) return;
  driveStatusMessage.value = "Signing out...";
  googleDriveManager.value.handleSignOut(() => {
    isSignedIn.value = false;
    googleUser.value = null;
    currentDriveFileId.value = null;
    currentDriveFileName.value = "";
    driveStatusMessage.value = "Signed out.";
  });
};

const getOrPromptForDriveFolder = async () => {
  if (!_checkDriveReadiness("set up a folder")) return;
  driveStatusMessage.value = "Accessing Google Drive folder...";
  const appFolderName = "AioniaCS_Data";
  try {
    const folderInfo = await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
    if (folderInfo && folderInfo.id) {
      driveFolderId.value = folderInfo.id;
      driveFolderName.value = folderInfo.name;
      localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
      localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
      driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
    } else {
      driveStatusMessage.value = "Could not auto-setup Drive folder. Please choose one.";
      await promptForDriveFolder(false);
    }
  } catch (error) {
    driveStatusMessage.value = `Folder setup error: ${error.message || "Please choose manually."}`;
    await promptForDriveFolder(false);
  }
};

const promptForDriveFolder = async (isDirectClick = true) => {
  if (!_checkDriveReadiness("select a folder")) return;
  driveStatusMessage.value = "Opening Google Drive folder picker...";
  googleDriveManager.value.showFolderPicker((error, folder) => {
    if (error) {
      driveStatusMessage.value = `Folder selection error: ${error.message || "Cancelled or failed."}`;
    } else if (folder && folder.id) {
      driveFolderId.value = folder.id;
      driveFolderName.value = folder.name;
      localStorage.setItem("aioniaDriveFolderId", folder.id);
      localStorage.setItem("aioniaDriveFolderName", folder.name);
      driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
      currentDriveFileId.value = null;
      currentDriveFileName.value = "";
    } else {
      driveStatusMessage.value = driveFolderId.value ? `Drive Folder: ${driveFolderName.value}` : "Folder selection cancelled.";
    }
  });
};

const handleSaveToDriveClick = async () => {
  if (!_checkDriveReadiness("save")) return;
  if (!driveFolderId.value) {
    driveStatusMessage.value = "Drive folder not set. Please choose a folder first.";
    await promptForDriveFolder(false);
    if (!driveFolderId.value) {
      driveStatusMessage.value = "Save cancelled: No Drive folder selected.";
      return;
    }
  }
  driveStatusMessage.value = `Saving to "${driveFolderName.value}"...`;
  const fileName = (character.name || "Aionia_Character_Sheet").replace(/[\\/:*?"<>|]/g, "_") + ".json";
  try {
    const savedFile = await dataManager.value.saveDataToDrive(
      character,
      skills,
      specialSkills,
      equipments,
      histories,
      driveFolderId.value,
      currentDriveFileId.value,
      fileName
    );
    if (savedFile && savedFile.id) {
      currentDriveFileId.value = savedFile.id;
      currentDriveFileName.value = savedFile.name;
      driveStatusMessage.value = `Saved: ${currentDriveFileName.value} to "${driveFolderName.value}".`;
      isCloudSaveSuccess.value = true;
      setTimeout(() => { isCloudSaveSuccess.value = false; }, 2000);
    } else {
      throw new Error("Save operation did not return expected file information.");
    }
  } catch (error) {
    driveStatusMessage.value = `Save error: ${error.message || "Unknown error"}`;
  }
};

const handleLoadFromDriveClick = async () => {
  if (!_checkDriveReadiness("load")) return;
  driveStatusMessage.value = "Opening Google Drive file picker...";
  googleDriveManager.value.showFilePicker(
    async (error, file) => {
      if (error) {
        driveStatusMessage.value = `File selection error: ${error.message || "Cancelled or failed."}`;
        return;
      }
      if (!file || !file.id) {
        driveStatusMessage.value = "File selection cancelled or no file chosen.";
        return;
      }
      driveStatusMessage.value = `Loading ${file.name} from Drive...`;
      try {
        const parsedData = await dataManager.value.loadDataFromDrive(file.id);
        if (parsedData) {
          Object.assign(character, parsedData.character);
          skills.splice(0, skills.length, ...parsedData.skills);
          specialSkills.splice(0, specialSkills.length, ...parsedData.specialSkills);
          Object.assign(equipments, parsedData.equipments);
          histories.splice(0, histories.length, ...parsedData.histories);
          currentDriveFileId.value = file.id;
          currentDriveFileName.value = file.name;
          driveStatusMessage.value = `Loaded: ${currentDriveFileName.value} from Drive.`;
        } else {
          throw new Error("Load operation did not return data.");
        }
      } catch (err) {
        driveStatusMessage.value = `Load error for ${file.name || "file"}: ${err.message || "Unknown error"}`;
      }
    },
    driveFolderId.value || null,
    ["application/json"]
  );
};

// --- Watchers (formerly `watch`) ---


watch(() => character.initialScar, (newVal) => {
  if (character.linkCurrentToInitialScar) {
    character.currentScar = newVal;
  }
});

watch(() => character.linkCurrentToInitialScar, (isLinked) => {
  if (isLinked) {
    character.currentScar = character.initialScar;
  }
});

// --- Lifecycle Hooks ---
let helpPanelClickListener = null;
onMounted(() => {
  // Initialize services
  cocofoliaExporter.value = new CocofoliaExporter();
  dataManager.value = new DataManager(AioniaGameData);

  // Setup UI logic
  isDesktop.value = !('ontouchstart' in window || navigator.maxTouchPoints > 0);

  helpPanelClickListener = (event) => {
    if (helpState.value === 'fixed') {
      const helpPanelEl = helpPanelRef.value?.panelEl;
      const helpIconEl = mainFooter.value?.helpIcon;
      if (helpPanelEl && helpIconEl && !helpPanelEl.contains(event.target) && !helpIconEl.contains(event.target)) {
        helpState.value = 'closed';
      }
    }
  };
  document.addEventListener('click', helpPanelClickListener);

  // Initialize Google Drive Manager and set up global callbacks for legacy script loading.
  if (window.GoogleDriveManager) {
      // In a real production app, these keys should be stored securely, e.g., in environment variables.
      const apiKey = "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU";
      const clientId =
        "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com";
      googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
      dataManager.value.setGoogleDriveManager(googleDriveManager.value);

      const handleGapiLoaded = async () => {
        if (isGapiInitialized.value || !googleDriveManager.value) return;
        isGapiInitialized.value = true;
        driveStatusMessage.value = "Google API Client: Loading...";
        try {
          await googleDriveManager.value.onGapiLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || "Not selected"}`
            : "Google API Client: Ready. Please sign in.";
        } catch (err) {
          driveStatusMessage.value = "Google API Client: Error initializing.";
          console.error("GAPI client init error:", err);
        }
      };

      const handleGisLoaded = async () => {
        if (isGisInitialized.value || !googleDriveManager.value) return;
        isGisInitialized.value = true;
        driveStatusMessage.value = "Google Sign-In: Loading...";
        try {
          await googleDriveManager.value.onGisLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || "Not selected"}`
            : "Google Sign-In: Ready. Please sign in.";
        } catch (err) {
          driveStatusMessage.value = "Google Sign-In: Error initializing.";
          console.error("GIS client init error:", err);
        }
      };

      // Poll for the Google API objects to become available on the window object.
      // This is more robust than relying on onload callbacks in a component context.
      const gapiPoll = setInterval(() => {
        if (window.gapi && window.gapi.load) {
          handleGapiLoaded();
          clearInterval(gapiPoll);
        }
      }, 100);

      const gisPoll = setInterval(() => {
        if (window.google && window.google.accounts) {
          handleGisLoaded();
          clearInterval(gisPoll);
        }
      }, 100);
  }

  const savedFolderId = localStorage.getItem('aioniaDriveFolderId');
  const savedFolderName = localStorage.getItem('aioniaDriveFolderName');
  if (savedFolderId) {
      driveFolderId.value = savedFolderId;
      driveFolderName.value = savedFolderName || "Previously Selected";
  }
});

onBeforeUnmount(() => {
  // Clean up global event listeners to prevent memory leaks.
  if (helpPanelClickListener) {
    document.removeEventListener('click', helpPanelClickListener);
  }
});
</script>

<template>
  <TopLeftControls
    :is-gapi-initialized="isGapiInitialized"
    :is-gis-initialized="isGisInitialized"
    :drive-status-message="driveStatusMessage"
    :can-sign-in-to-google="canSignInToGoogle"
    :is-signed-in="isSignedIn"
    @sign-in="handleSignInClick"
    @sign-out="handleSignOutClick"
    @choose-folder="promptForDriveFolder(true)"
  />
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="main-grid">
    <CharacterBasicInfo v-model:character="character" />

    <ScarWeaknessSection
      v-model:character="character"
      :session-names="sessionNamesForWeaknessDropdown"
    />

    <SkillsSection v-model:skills="skills" />
    <SpecialSkillsSection v-model:specialSkills="specialSkills" />
    <ItemsSection
      v-model:equipments="equipments"
      v-model:otherItems="character.otherItems"
    />
    <CharacterMemoSection v-model="character.memo" />
    <AdventureLogSection
      :histories="histories"
      @add-item="addHistoryItem"
      @remove-item="removeHistoryItem"
      @update:history="updateHistoryItem"
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
    :is-signed-in="isSignedIn"
    :can-operate-drive="canOperateDrive"
    :output-button-text="outputButtonText"
    :is-cloud-save-success="isCloudSaveSuccess"
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
