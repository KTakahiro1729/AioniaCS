<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useCharacterStore } from './stores/characterStore.js';
import { useUiStore } from './stores/uiStore.js';
import AdventureLogSection from './components/sections/AdventureLogSection.vue';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import { DataManager } from './services/dataManager.js';
import { CocofoliaExporter } from './services/cocofoliaExporter.js';
import { GoogleDriveManager } from './services/googleDriveManager.js';
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

// --- Reactive State (formerly `data`) ---

// Service instances are wrapped in ref() to be assigned later in onMounted.
const dataManager = ref(null);
const cocofoliaExporter = ref(null);
const googleDriveManager = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const googleUser = ref(null);


// --- Computed Properties (formerly `computed`) ---

const isHelpVisible = computed(() => uiStore.isHelpVisible);
const maxExperiencePoints = computed(() => characterStore.maxExperiencePoints);
const currentExperiencePoints = computed(() => characterStore.currentExperiencePoints);
const currentWeight = computed(() => characterStore.currentWeight);
const experienceStatusClass = computed(() => uiStore.experienceStatusClass);
const sessionNamesForWeaknessDropdown = computed(() => characterStore.sessionNamesForWeaknessDropdown);
const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);
const canOperateDrive = computed(() => uiStore.canOperateDrive);


// --- Methods (formerly `methods`) ---



const handleHelpIconMouseOver = () => {
  if (uiStore.isDesktop && uiStore.helpState === "closed") {
    uiStore.helpState = "hovered";
  }
};

const handleHelpIconMouseLeave = () => {
  if (uiStore.isDesktop && uiStore.helpState === "hovered") {
    uiStore.helpState = "closed";
  }
};

const handleHelpIconClick = () => {
  if (uiStore.isDesktop) {
    uiStore.helpState = uiStore.helpState === "fixed" ? "closed" : "fixed";
  } else {
    uiStore.helpState = uiStore.helpState === "closed" ? "fixed" : "closed";
  }
};

const closeHelpPanel = () => {
  uiStore.helpState = "closed";
};

const saveData = () => {
  dataManager.value.saveData(
    characterStore.character,
    characterStore.skills,
    characterStore.specialSkills,
    characterStore.equipments,
    characterStore.histories
  );
};

const handleFileUpload = (event) => {
  dataManager.value.handleFileUpload(
    event,
    (parsedData) => {
      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
    },
    (errorMessage) => showCustomAlert(errorMessage)
  );
};

const outputToCocofolia = () => {
  const exportData = {
    character: characterStore.character,
    skills: characterStore.skills,
    specialSkills: characterStore.specialSkills,
    equipments: characterStore.equipments,
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
      uiStore.outputButtonText = AioniaGameData.uiMessages.outputButton.failed;
      setTimeout(() => {
        uiStore.outputButtonText = AioniaGameData.uiMessages.outputButton.default;
      }, 3000);
    }
  } catch (err) {
    console.error(err);
    uiStore.outputButtonText = AioniaGameData.uiMessages.outputButton.error;
    setTimeout(() => {
        uiStore.outputButtonText = AioniaGameData.uiMessages.outputButton.default;
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
    uiStore.outputButtonText = buttonMessages.animating;
    button.classList.add("state-2");
  }, timings.state1_bgFill);
  
  setTimeout(() => {
    button.classList.remove("state-2");
    button.classList.add("state-3");
  }, timings.state1_bgFill + timings.state2_textHold);
  
  setTimeout(() => {
    button.classList.remove("state-3");
    uiStore.outputButtonText = buttonMessages.default;
    button.classList.add("state-4");
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut);
  
  setTimeout(() => {
    button.classList.remove("is-animating", "state-4");
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut + timings.state4_bgReset);
};

const showCustomAlert = (message) => alert(message);


const _checkDriveReadiness = (actionContext = "operate") => {
  if (!googleDriveManager.value) {
    uiStore.driveStatusMessage = "Error: Drive Manager is not available.";
    return false;
  }
  if (!uiStore.isSignedIn && actionContext !== "sign in") {
    uiStore.driveStatusMessage = `Error: Please sign in to ${actionContext}.`;
    return false;
  }
  return true;
};

const handleSignInClick = () => {
  if (!googleDriveManager.value) {
      uiStore.driveStatusMessage = "Error: Drive Manager not available.";
      return;
  }
  uiStore.driveStatusMessage = "Signing in... Please wait.";
  try {
    googleDriveManager.value.handleSignIn((error, authResult) => {
      if (error || !authResult || !authResult.signedIn) {
        uiStore.isSignedIn = false;
        googleUser.value = null;
        uiStore.driveStatusMessage = "Sign-in failed. " + (error ? error.message || error.details || "Please try again." : "Ensure pop-ups are enabled.");
      } else {
        uiStore.isSignedIn = true;
        googleUser.value = { displayName: "User" }; // Placeholder
        uiStore.driveStatusMessage = `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`;
        if (!uiStore.driveFolderId) {
          getOrPromptForDriveFolder();
        }
      }
    });
  } catch (err) {
    uiStore.isSignedIn = false;
    googleUser.value = null;
    uiStore.driveStatusMessage = "Sign-in error: " + (err.message || "An unexpected error occurred.");
  }
};

const handleSignOutClick = () => {
  if (!_checkDriveReadiness("sign out")) return;
  uiStore.driveStatusMessage = "Signing out...";
  googleDriveManager.value.handleSignOut(() => {
    uiStore.isSignedIn = false;
    googleUser.value = null;
    uiStore.currentDriveFileId = null;
    uiStore.currentDriveFileName = "";
    uiStore.driveStatusMessage = "Signed out.";
  });
};

const getOrPromptForDriveFolder = async () => {
  if (!_checkDriveReadiness("set up a folder")) return;
  uiStore.driveStatusMessage = "Accessing Google Drive folder...";
  const appFolderName = "AioniaCS_Data";
  try {
    const folderInfo = await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
    if (folderInfo && folderInfo.id) {
      uiStore.driveFolderId = folderInfo.id;
      uiStore.driveFolderName = folderInfo.name;
      localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
      localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
      uiStore.driveStatusMessage = `Drive Folder: ${uiStore.driveFolderName}`;
    } else {
      uiStore.driveStatusMessage = "Could not auto-setup Drive folder. Please choose one.";
      await promptForDriveFolder(false);
    }
  } catch (error) {
    uiStore.driveStatusMessage = `Folder setup error: ${error.message || "Please choose manually."}`;
    await promptForDriveFolder(false);
  }
};

const promptForDriveFolder = async (isDirectClick = true) => {
  if (!_checkDriveReadiness("select a folder")) return;
  uiStore.driveStatusMessage = "Opening Google Drive folder picker...";
  googleDriveManager.value.showFolderPicker((error, folder) => {
    if (error) {
      uiStore.driveStatusMessage = `Folder selection error: ${error.message || "Cancelled or failed."}`;
    } else if (folder && folder.id) {
      uiStore.driveFolderId = folder.id;
      uiStore.driveFolderName = folder.name;
      localStorage.setItem("aioniaDriveFolderId", folder.id);
      localStorage.setItem("aioniaDriveFolderName", folder.name);
      uiStore.driveStatusMessage = `Drive Folder: ${uiStore.driveFolderName}`;
      uiStore.currentDriveFileId = null;
      uiStore.currentDriveFileName = "";
    } else {
      uiStore.driveStatusMessage = uiStore.driveFolderId ? `Drive Folder: ${uiStore.driveFolderName}` : "Folder selection cancelled.";
    }
  });
};

const handleSaveToDriveClick = async () => {
  if (!_checkDriveReadiness("save")) return;
  if (!uiStore.driveFolderId) {
    uiStore.driveStatusMessage = "Drive folder not set. Please choose a folder first.";
    await promptForDriveFolder(false);
    if (!uiStore.driveFolderId) {
      uiStore.driveStatusMessage = "Save cancelled: No Drive folder selected.";
      return;
    }
  }
  uiStore.driveStatusMessage = `Saving to "${uiStore.driveFolderName}"...`;
  const fileName = (characterStore.character.name || "Aionia_Character_Sheet").replace(/[\\/:*?"<>|]/g, "_") + ".json";
  try {
    const savedFile = await dataManager.value.saveDataToDrive(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
      uiStore.driveFolderId,
      uiStore.currentDriveFileId,
      fileName
    );
    if (savedFile && savedFile.id) {
      uiStore.currentDriveFileId = savedFile.id;
      uiStore.currentDriveFileName = savedFile.name;
      uiStore.driveStatusMessage = `Saved: ${uiStore.currentDriveFileName} to "${uiStore.driveFolderName}".`;
      uiStore.isCloudSaveSuccess = true;
      setTimeout(() => { uiStore.isCloudSaveSuccess = false; }, 2000);
    } else {
      throw new Error("Save operation did not return expected file information.");
    }
  } catch (error) {
    uiStore.driveStatusMessage = `Save error: ${error.message || "Unknown error"}`;
  }
};

const handleLoadFromDriveClick = async () => {
  if (!_checkDriveReadiness("load")) return;
  driveStatusMessage.value = "Opening Google Drive file picker...";
  googleDriveManager.value.showFilePicker(
    async (error, file) => {
      if (error) {
        uiStore.driveStatusMessage = `File selection error: ${error.message || "Cancelled or failed."}`;
        return;
      }
      if (!file || !file.id) {
        uiStore.driveStatusMessage = "File selection cancelled or no file chosen.";
        return;
      }
      uiStore.driveStatusMessage = `Loading ${file.name} from Drive...`;
      try {
        const parsedData = await dataManager.value.loadDataFromDrive(file.id);
        if (parsedData) {
          Object.assign(characterStore.character, parsedData.character);
          characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
          characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
          Object.assign(characterStore.equipments, parsedData.equipments);
          characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
          uiStore.currentDriveFileId = file.id;
          uiStore.currentDriveFileName = file.name;
          uiStore.driveStatusMessage = `Loaded: ${uiStore.currentDriveFileName} from Drive.`;
        } else {
          throw new Error("Load operation did not return data.");
        }
      } catch (err) {
        uiStore.driveStatusMessage = `Load error for ${file.name || "file"}: ${err.message || "Unknown error"}`;
      }
    },
    uiStore.driveFolderId || null,
    ["application/json"]
  );
};

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
let helpPanelClickListener = null;
onMounted(() => {
  // Initialize services
  cocofoliaExporter.value = new CocofoliaExporter();
  dataManager.value = new DataManager(AioniaGameData);

  // Setup UI logic
  uiStore.isDesktop = !('ontouchstart' in window || navigator.maxTouchPoints > 0);

  helpPanelClickListener = (event) => {
    if (uiStore.helpState === 'fixed') {
      const helpPanelEl = helpPanelRef.value?.panelEl;
      const helpIconEl = mainFooter.value?.helpIcon;
      if (helpPanelEl && helpIconEl && !helpPanelEl.contains(event.target) && !helpIconEl.contains(event.target)) {
        uiStore.helpState = 'closed';
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
        if (uiStore.isGapiInitialized || !googleDriveManager.value) return;
        uiStore.isGapiInitialized = true;
        uiStore.driveStatusMessage = "Google API Client: Loading...";
        try {
          await googleDriveManager.value.onGapiLoad();
          uiStore.driveStatusMessage = uiStore.isSignedIn
            ? `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`
            : "Google API Client: Ready. Please sign in.";
        } catch (err) {
          uiStore.driveStatusMessage = "Google API Client: Error initializing.";
          console.error("GAPI client init error:", err);
        }
      };

      const handleGisLoaded = async () => {
        if (uiStore.isGisInitialized || !googleDriveManager.value) return;
        uiStore.isGisInitialized = true;
        uiStore.driveStatusMessage = "Google Sign-In: Loading...";
        try {
          await googleDriveManager.value.onGisLoad();
          uiStore.driveStatusMessage = uiStore.isSignedIn
            ? `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`
            : "Google Sign-In: Ready. Please sign in.";
        } catch (err) {
          uiStore.driveStatusMessage = "Google Sign-In: Error initializing.";
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
      uiStore.driveFolderId = savedFolderId;
      uiStore.driveFolderName = savedFolderName || "Previously Selected";
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
    :help-state="uiStore.helpState"
    :experience-status-class="experienceStatusClass"
    :current-experience-points="currentExperiencePoints"
    :max-experience-points="maxExperiencePoints"
    :current-weight="currentWeight"
    :is-signed-in="uiStore.isSignedIn"
    :can-operate-drive="canOperateDrive"
    :output-button-text="uiStore.outputButtonText"
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
