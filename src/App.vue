<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import CharacterInfo from './components/CharacterInfo.vue'; // Import new component
import ScarsWeaknesses from './components/ScarsWeaknesses.vue'; // Import new component
import SkillsList from './components/SkillsList.vue'; // Import new component
import SpecialSkills from './components/SpecialSkills.vue'; // Import new component
import ItemsSection from './components/ItemsSection.vue'; // Import new component
import CharacterMemo from './components/CharacterMemo.vue'; // Import new component
import AdventureLog from './components/AdventureLog.vue'; // Import new component
import GoogleDriveMenu from './components/GoogleDriveMenu.vue'; // Import new component

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import { DataManager } from './services/dataManager.js';
import { CocofoliaExporter } from './services/cocofoliaExporter.js';
import { ImageManager } from './services/imageManager.js';
import { GoogleDriveManager } from './services/googleDriveManager.js';
import { deepClone, createWeaknessArray } from './utils/utils.js';

// --- Template Refs ---
// These refs will be linked to elements in the template via `ref="..."`.
// driveMenuToggleButton and driveMenu are now in GoogleDriveMenu.vue
const helpIcon = ref(null);
const helpPanel = ref(null);
const outputButton = ref(null);

// --- Reactive State (formerly `data`) ---

// Service instances are wrapped in ref() to be assigned later in onMounted.
const dataManager = ref(null);
const cocofoliaExporter = ref(null);
const googleDriveManager = ref(null);
const imageManagerInstance = ref(null); // This might be used by CharacterInfo if passed as prop or provided

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
// showDriveMenu is now in GoogleDriveMenu.vue
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

// currentImageSrc is now in CharacterInfo.vue
const isHelpVisible = computed(() => helpState.value !== 'closed');

// sessionNamesForWeaknessDropdown is now in ScarsWeaknesses.vue
const maxExperiencePoints = computed(() => { // This remains as it depends on App.vue state
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

const currentWeight = computed(() => { // This remains
  const weaponWeights = AioniaGameData.equipmentWeights.weapon;
  const armorWeights = AioniaGameData.equipmentWeights.armor;
  let weight = 0;
  weight += weaponWeights[equipments.weapon1.group] || 0;
  weight += weaponWeights[equipments.weapon2.group] || 0;
  weight += armorWeights[equipments.armor.group] || 0;
  return weight;
});

const experienceStatusClass = computed(() => // This remains
  currentExperiencePoints.value > maxExperiencePoints.value
    ? 'status-display--experience-over'
    : 'status-display--experience-ok'
);

// canSignInToGoogle is now in GoogleDriveMenu.vue (computed based on props)
const canOperateDrive = computed(() => isSignedIn.value && driveFolderId.value); // This remains as it depends on App.vue state (driveFolderId)


// --- Methods (formerly `methods`) ---

// toggleDriveMenu is now internal to GoogleDriveMenu.vue

// handleCurrentScarInput is now in ScarsWeaknesses.vue

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

// All special skill methods (...) are now in SpecialSkills.vue.
// addExpert and removeExpert are now in SkillsList.vue
// All history methods (hasHistoryContent, addHistoryItem, removeHistoryItem) are now in AdventureLog.vue.

// expertPlaceholder is now in SkillsList.vue
// handleSpeciesChange is now in CharacterInfo.vue

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
  const button = outputButton.value;
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

// Image handling methods (handleImageUpload, nextImage, previousImage, removeCurrentImage) are now in CharacterInfo.vue

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
  showDriveMenu.value = false;
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
  showDriveMenu.value = false;
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
  showDriveMenu.value = false;
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
  if (isDirectClick) showDriveMenu.value = false;
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

// Method to update character data from CharacterInfo component
const updateCharacterData = (updatedCharacter) => {
  Object.assign(character, updatedCharacter);
  // If specific fields need special handling, do it here.
  // For example, if character.images was directly a ref in App.vue,
  // you might need to update it like:
  // character.images = updatedCharacter.images;
};

// Method to update skills data from SkillsList component
const updateSkillsData = (updatedSkills) => {
  // skills is a reactive array of objects. We need to update it carefully.
  // Simple assignment skills.value = updatedSkills won't work if skills is reactive().
  // Instead, modify the array contents.
  skills.length = 0; // Clear current skills
  updatedSkills.forEach(skill => skills.push(skill)); // Add new skills
  // This ensures the original reactive array reference is maintained.
  // Call saveData or other necessary functions if skills changes affect overall state
  saveData();
};

const handleSkillsChanged = () => {
  // This function can be used if specific actions beyond data update/save are needed
  // when skills change, for example, re-calculating dependent computed properties
  // not automatically covered by Vue's reactivity.
  // For now, experience points are computed, so this might just call saveData.
  saveData();
};

// Method to update special skills data from SpecialSkills component
const updateSpecialSkillsData = (updatedData) => {
  specialSkills.length = 0;
  updatedData.forEach(item => specialSkills.push(item));
  saveData();
};

const handleSpecialSkillsChanged = () => {
  saveData();
};

// Method to update equipments data from ItemsSection component
const updateEquipments = (updatedData) => {
  Object.assign(equipments, updatedData);
  // currentWeight computed property will update automatically.
  saveData();
};

const updateCharacterOtherItems = (newValue) => {
  character.otherItems = newValue;
  saveData();
};

const handleItemsChanged = () => {
  // This primarily ensures saveData is called if not covered by specific updates.
  // Also, currentWeight will recalculate due to reactivity on `equipments`.
  saveData();
};

// Method to update character memo from CharacterMemo component
const updateCharacterMemo = (newValue) => {
  character.memo = newValue;
  saveData(); // Assuming changes to memo should be saved immediately
};

const handleMemoChanged = () => {
  // This could trigger other actions if needed, for now, covered by updateCharacterMemo
  saveData();
};

// Method to update histories data from AdventureLog component
const updateHistories = (updatedData) => {
  histories.length = 0;
  updatedData.forEach(item => histories.push(item));
  // maxExperiencePoints computed property will update automatically if histories affect it.
  saveData();
};

const handleHistoriesChanged = () => {
  // This ensures saveData is called and experience points are recalculated.
  saveData();
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

// Watcher for showDriveMenu (click outside) is now in GoogleDriveMenu.vue

// Watchers for character.initialScar and character.linkCurrentToInitialScar are now in ScarsWeaknesses.vue

// --- Lifecycle Hooks ---
let helpPanelClickListener = null;
onMounted(() => {
  // Initialize services
  cocofoliaExporter.value = new CocofoliaExporter();
  dataManager.value = new DataManager(AioniaGameData);
  imageManagerInstance.value = ImageManager;

  // Setup UI logic
  isDesktop.value = !('ontouchstart' in window || navigator.maxTouchPoints > 0);

  helpPanelClickListener = (event) => {
    if (helpState.value === 'fixed') {
      const helpPanelEl = helpPanel.value;
      const helpIconEl = helpIcon.value;
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
  // driveMenuClickListener is removed as its logic is moved to GoogleDriveMenu.vue
  if (helpPanelClickListener) {
    document.removeEventListener('click', helpPanelClickListener);
  }
});
</script>

<template>
  <GoogleDriveMenu
    :isGapiInitialized="isGapiInitialized"
    :isGisInitialized="isGisInitialized"
    :isSignedIn="isSignedIn"
    :driveStatusMessage="driveStatusMessage"
    @sign-in="handleSignInClick"
    @sign-out="handleSignOutClick"
    @choose-folder="promptForDriveFolder(true)"
  />
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="main-grid">
    <CharacterInfo :character="character" @update:character="updateCharacterData" @image-updated="saveData" />
    <ScarsWeaknesses :character="character" :histories="histories" :AioniaGameData="AioniaGameData" @update:character="updateCharacterData" />
    <SkillsList :skills="skills" :AioniaGameData="AioniaGameData" :manageListItemUtil="_manageListItem" @update:skills="updateSkillsData" @skills-changed="handleSkillsChanged" />
    <SpecialSkills :specialSkills="specialSkills" :AioniaGameData="AioniaGameData" :manageListItemUtil="_manageListItem" @update:specialSkills="updateSpecialSkillsData" @special-skills-changed="handleSpecialSkillsChanged" />
    <ItemsSection :equipments="equipments" :characterOtherItems="character.otherItems" :AioniaGameData="AioniaGameData" @update:equipments="updateEquipments" @update:characterOtherItems="updateCharacterOtherItems" @items-changed="handleItemsChanged" />
    <CharacterMemo :characterMemo="character.memo" :AioniaGameData="AioniaGameData" @update:characterMemo="updateCharacterMemo" @memo-changed="handleMemoChanged" />
    <AdventureLog :histories="histories" :manageListItemUtil="_manageListItem" @update:histories="updateHistories" @histories-changed="handleHistoriesChanged" />

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
      :class="{ 'footer-help-icon--fixed': helpState === 'fixed' }"
      @mouseover="handleHelpIconMouseOver"
      @mouseleave="handleHelpIconMouseLeave"
      @click="handleHelpIconClick"
      tabindex="0"
    >
      ？
    </div>
    <div :class="['status-display', experienceStatusClass]">
      経験点 {{ currentExperiencePoints }} / {{ maxExperiencePoints }}
    </div>
    <div class="status-display status-display--weight">
      荷重: {{ currentWeight }}
    </div>
    <div class="footer-button-container">
      <button
        class="button-base footer-button footer-button--save"
        @click="saveData"
      >
        データ保存
      </button>
      <button
        v-if="isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="handleSaveToDriveClick"
        :disabled="!canOperateDrive"
        title="Google Driveに保存"
      >
          <span v-if="isCloudSaveSuccess" class="icon-svg icon-svg--footer icon-svg-success" aria-label="Save Succeeded"></span>
          <span v-else class="icon-svg icon-svg--footer icon-svg-upload" aria-label="Save to Drive"></span>
      </button>
    </div>
    <div class="footer-button-container">
      <label for="load_input_vue" class="button-base footer-button footer-button--load">データ読込</label>
      <input type="file" id="load_input_vue" @change="handleFileUpload" accept=".json,.txt,.zip" class="hidden" />
      <button
        v-if="isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="handleLoadFromDriveClick"
        :disabled="!isSignedIn"
        title="Google Driveから読込"
      >
          <span class="icon-svg icon-svg--footer icon-svg-download" aria-label="Load from Drive"></span>
      </button>
    </div>
    <div class="button-base footer-button footer-button--output" @click="outputToCocofolia" ref="outputButton">
      {{ outputButtonText }}
    </div>
    <transition name="fade">
      <div class="help-panel" ref="helpPanel" v-if="isHelpVisible">
        <button class="help-close" @click="closeHelpPanel">×</button>
        <div v-html="AioniaGameData.helpText"></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/*
  It is recommended to use Vite's asset handling.
  You can either @import your main CSS file here or manage it
  in your main.js/main.ts entry file.
*/
@import './assets/css/style.css';

/* Additional component-specific styles can go here */
/* Styles that were specific to #character_info and its children have been moved to CharacterInfo.vue */
/* Styles for #scar_weakness_section and its children are now in ScarsWeaknesses.vue */
/* Styles for #skills and its children are now in SkillsList.vue */
/* Styles for #special_skills and its children are now in SpecialSkills.vue */
/* Styles for #items_section and its children are now in ItemsSection.vue */
/* Styles for #character_memo and its children are now in CharacterMemo.vue */
/* Styles for #adventure_log_section and its children are now in AdventureLog.vue */
/* Styles for .top-left-controls and Google Drive Menu are now in GoogleDriveMenu.vue */
.hidden {
  display: none !important;
}
</style>
