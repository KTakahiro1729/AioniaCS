<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

// --- Module Imports ---
// This approach is standard for Vite/ESM projects, making dependencies explicit.
import { AioniaGameData } from './data/gameData.js';
import { DataManager } from './services/dataManager.js';
import { CocofoliaExporter } from './services/cocofoliaExporter.js';
import { ImageManager } from './services/imageManager.js';
import { GoogleDriveManager } from './services/googleDriveManager.js';
import { deepClone, createWeaknessArray } from './utils/utils.js';
import ScarWeaknessSection from './components/sections/ScarWeaknessSection.vue';
import { useWeaknessManagement } from './composables/features/useWeaknessManagement.js';

// --- Template Refs ---
// These refs will be linked to elements in the template via `ref="..."`.
const driveMenuToggleButton = ref(null);
const driveMenu = ref(null);
const helpIcon = ref(null);
const helpPanel = ref(null);
const outputButton = ref(null);

// --- Reactive State (formerly `data`) ---

// Service instances are wrapped in ref() to be assigned later in onMounted.
const dataManager = ref(null);
const cocofoliaExporter = ref(null);
const googleDriveManager = ref(null);
const imageManagerInstance = ref(null);

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
const showDriveMenu = ref(false);
const currentImageIndex = ref(0); // Start with -1 to indicate no image selected
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

const currentImageSrc = computed(() => {
  if (
    character.images &&
    character.images.length > 0 &&
    currentImageIndex.value >= 0 &&
    currentImageIndex.value < character.images.length
  ) {
    return character.images[currentImageIndex.value];
  }
  return null;
});

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

const currentWeight = computed(() => {
  const weaponWeights = AioniaGameData.equipmentWeights.weapon;
  const armorWeights = AioniaGameData.equipmentWeights.armor;
  let weight = 0;
  weight += weaponWeights[equipments.weapon1.group] || 0;
  weight += weaponWeights[equipments.weapon2.group] || 0;
  weight += armorWeights[equipments.armor.group] || 0;
  return weight;
});

const experienceStatusClass = computed(() =>
  currentExperiencePoints.value > maxExperiencePoints.value
    ? 'status-display--experience-over'
    : 'status-display--experience-ok'
);

const { sessionNamesForWeaknessDropdown } = useWeaknessManagement(ref(histories));

const canSignInToGoogle = computed(() => isGapiInitialized.value && isGisInitialized.value && !isSignedIn.value);
const canOperateDrive = computed(() => isSignedIn.value && driveFolderId.value);


// --- Methods (formerly `methods`) ---

const toggleDriveMenu = () => {
  showDriveMenu.value = !showDriveMenu.value;
};


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
const addExpert = (skill) => {
  if (skill.canHaveExperts) _manageListItem({ list: skill.experts, action: "add", newItemFactory: () => ({ value: "" }) });
};
const removeExpert = (skill, expertIndex) => _manageListItem({
  list: skill.experts,
  action: "remove",
  index: expertIndex,
  newItemFactory: () => ({ value: "" }),
  hasContentChecker: (expert) => expert.value && expert.value.trim() !== "",
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

const expertPlaceholder = (skill) => skill.checked ? AioniaGameData.placeholderTexts.expertSkill : AioniaGameData.placeholderTexts.expertSkillDisabled;
const handleSpeciesChange = () => { if (character.species !== "other") character.rareSpecies = ""; };
const availableSpecialSkillNames = (index) => specialSkills[index] ? (AioniaGameData.specialSkillData[specialSkills[index].group] || []) : [];
const updateSpecialSkillOptions = (index) => {
  if (specialSkills[index]) {
    specialSkills[index].name = "";
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

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!imageManagerInstance.value) {
    console.error("ImageManager not initialized");
    return;
  }
  try {
    const imageData = await imageManagerInstance.value.loadImage(file);
    if (!character.images) {
      character.images = [];
    }
    character.images.push(imageData);
    currentImageIndex.value = character.images.length - 1;
  } catch (error) {
    console.error("Error loading image:", error);
    showCustomAlert("画像の読み込みに失敗しました：" + error.message);
  } finally {
    event.target.value = null;
  }
};

const nextImage = () => {
  if (character.images && character.images.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % character.images.length;
  }
};

const previousImage = () => {
  if (character.images && character.images.length > 0) {
    currentImageIndex.value = (currentImageIndex.value - 1 + character.images.length) % character.images.length;
  }
};

const removeCurrentImage = () => {
  if (character.images && character.images.length > 0 && currentImageIndex.value >= 0) {
    character.images.splice(currentImageIndex.value, 1);
    if (character.images.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= character.images.length) {
      currentImageIndex.value = character.images.length - 1;
    }
  }
};


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

let driveMenuClickListener = null;
watch(showDriveMenu, (newValue) => {
  if (driveMenuClickListener) {
    document.removeEventListener('click', driveMenuClickListener, true);
    driveMenuClickListener = null;
  }
  if (newValue) {
    nextTick(() => {
      const menuEl = driveMenu.value;
      const toggleButtonEl = driveMenuToggleButton.value;
      if (menuEl && toggleButtonEl) {
        driveMenuClickListener = (event) => {
          if (!menuEl.contains(event.target) && !toggleButtonEl.contains(event.target)) {
            showDriveMenu.value = false;
          }
        };
        document.addEventListener('click', driveMenuClickListener, true);
      }
    });
  }
});

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
  if (driveMenuClickListener) {
    document.removeEventListener('click', driveMenuClickListener, true);
  }
  if (helpPanelClickListener) {
    document.removeEventListener('click', helpPanelClickListener);
  }
});
</script>

<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        class="button-base icon-button"
        title="Google Drive Menu"
        v-if="isGapiInitialized && isGisInitialized"
        @click="toggleDriveMenu"
        ref="driveMenuToggleButton"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Google Drive"></span>
      </button>
      <div class="floating-menu" v-if="showDriveMenu" ref="driveMenu">
        <div class="menu-item status-message" id="floating_drive_status_message">
          {{ driveStatusMessage }}
        </div>
        <button class="menu-item button-base" v-if="canSignInToGoogle" @click="handleSignInClick">
          Sign In with Google
        </button>
        <button class="menu-item button-base" v-if="isSignedIn" @click="handleSignOutClick">
          Sign Out
        </button>
        <button class="menu-item button-base" v-if="isSignedIn" @click="promptForDriveFolder(true)" :disabled="!isSignedIn">
          Choose Drive Folder
        </button>
      </div>
    </div>
  </div>
  <div class="tool-title">Aionia TRPG Character Sheet</div>
  <div class="main-grid">
    <div id="character_info" class="character-info">
      <div class="box-title">基本情報</div>
      <div class="box-content">
        <div class="character-image-container">
          <div class="image-display-area">
            <div class="image-display-wrapper" v-if="character.images && character.images.length > 0">
              <img
                v-if="currentImageSrc"
                :src="currentImageSrc"
                class="character-image-display"
                alt="Character Image"
              />
              <button
                @click="previousImage"
                class="button-base button-imagenav button-imagenav--prev"
                :disabled="character.images.length <= 1"
                aria-label="前の画像"
              >&lt;</button>
              <button
                @click="nextImage"
                class="button-base button-imagenav button-imagenav--next"
                :disabled="character.images.length <= 1"
                aria-label="次の画像"
              >&gt;</button>
              <div class="image-count-display">{{ currentImageIndex + 1 }} / {{ character.images.length }}</div>
            </div>
            <div class="character-image-placeholder" v-else>No Image</div>
          </div>
          <div class="image-controls">
            <input
              type="file"
              id="character_image_upload"
              @change="handleImageUpload"
              accept="image/*"
              style="display: none"
            />
            <label for="character_image_upload" class="button-base imagefile-button imagefile-button--upload">画像を追加</label>
            <button
              :disabled="!currentImageSrc"
              @click="removeCurrentImage"
              class="button-base imagefile-button imagefile-button--delete"
              aria-label="現在の画像を削除"
            >削除</button>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <label for="name">キャラクター名</label>
            <input type="text" id="name" v-model="character.name" />
          </div>
          <div class="info-item info-item--double">
            <label for="player_name">プレイヤー名</label>
            <input type="text" id="player_name" v-model="character.playerName"/>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item" :class="{'info-item--full': character.species !== 'other', 'info-item--double': character.species === 'other'}">
            <label for="species">種族</label>
            <select id="species" v-model="character.species" @change="handleSpeciesChange">
              <option
                v-for="option in AioniaGameData.speciesOptions"
                :key="option.value"
                :value="option.value"
                :disabled="option.disabled"
              >{{ option.label }}</option>
            </select>
          </div>
          <div class="info-item info-item--double" v-if="character.species === 'other'">
            <label for="rare_species">種族名（希少人種）</label>
            <input type="text" id="rare_species" v-model="character.rareSpecies"/>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item info-item--quadruple">
            <label for="gender">性別</label>
            <input type="text" id="gender" v-model="character.gender" />
          </div>
          <div class="info-item info-item--quadruple">
            <label for="age">年齢</label>
            <input type="number" id="age" v-model.number="character.age" min="0"/>
          </div>
          <div class="info-item info-item--quadruple">
            <label for="height">身長</label>
            <input type="text" id="height" v-model="character.height" />
          </div>
          <div class="info-item info-item--quadruple">
            <label for="weight_char">体重</label>
            <input type="text" id="weight_char" v-model="character.weight"/>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item info-item--triple">
            <label for="origin">出身地</label>
            <input type="text" id="origin" v-model="character.origin" />
          </div>
          <div class="info-item info-item--triple">
            <label for="occupation">職業</label>
            <input type="text" id="occupation" v-model="character.occupation"/>
          </div>
          <div class="info-item info-item--triple">
            <label for="faith">信仰</label>
            <input type="text" id="faith" v-model="character.faith" />
          </div>
        </div>
      </div>
    </div>

    <ScarWeaknessSection
      v-model:character="character"
      :session-names="sessionNamesForWeaknessDropdown"
    />

    <div id="skills" class="skills">
      <div class="box-title">技能</div>
      <ul class="skills-list box-content list-reset">
        <li v-for="(skill) in skills" :key="skill.id" class="skill-list">
          <div class="skill-header">
            <input type="checkbox" :id="skill.id" v-model="skill.checked" />
            <label :for="skill.id" class="skill-name">{{ skill.name }}</label>
          </div>
          <div v-if="skill.canHaveExperts && skill.checked" class="experts-section">
            <ul class="expert-list list-reset">
              <li v-for="(expert, expIndex) in skill.experts" :key="expIndex" class="base-list-item">
                <div class="delete-button-wrapper">
                  <button
                    type="button"
                    class="button-base list-button list-button--delete"
                    @click="removeExpert(skill, expIndex)"
                    :disabled="skill.experts.length <= 1 && expert.value===''"
                    aria-label="専門技能を削除"
                  >－</button>
                </div>
                <input
                  type="text"
                  v-model="expert.value"
                  :placeholder="expertPlaceholder(skill)"
                  :disabled="!skill.checked"
                  class="flex-grow"
                />
              </li>
            </ul>
            <div class="add-button-container-left">
              <button
                type="button"
                class="button-base list-button list-button--add"
                @click="addExpert(skill)"
                aria-label="専門技能を追加"
              >＋</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div id="special_skills" class="special-skills">
        <div class="box-title">特技</div>
        <div class="box-content">
            <ul class="list-reset special-skills-list">
              <li v-for="(specialSkill, index) in specialSkills" :key="index" class="base-list-item special-skill-item">
                <div class="delete-button-wrapper">
                  <button
                    type="button"
                    class="button-base list-button list-button--delete"
                    @click="removeSpecialSkill(index)"
                    :disabled="specialSkills.length <= 1 && !hasSpecialSkillContent(specialSkill)"
                    aria-label="特技を削除"
                  >－</button>
                </div>
                <div class="flex-grow">
                  <div class="flex-group">
                    <select
                      v-model="specialSkill.group"
                      @change="updateSpecialSkillOptions(index)"
                      class="flex-item-1"
                    >
                      <option
                        v-for="option in AioniaGameData.specialSkillGroupOptions"
                        :key="option.value"
                        :value="option.value"
                      >{{ option.label }}</option>
                    </select>
                    <select
                      v-model="specialSkill.name"
                      @change="updateSpecialSkillNoteVisibility(index)"
                      :disabled="!specialSkill.group"
                      class="flex-item-2"
                    >
                      <option value="">---</option>
                      <option
                        v-for="opt in availableSpecialSkillNames(index)"
                        :key="opt.value"
                        :value="opt.value"
                      >{{ opt.label }}</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    v-model="specialSkill.note"
                    v-show="specialSkill.showNote"
                    class="special-skill-note-input"
                    :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
                  />
                </div>
              </li>
            </ul>
            <div class="add-button-container-left" v-if="specialSkills.length < AioniaGameData.config.maxSpecialSkills">
              <button
                type="button"
                class="button-base list-button list-button--add"
                @click="addSpecialSkillItem()"
                aria-label="特技を追加"
              >＋</button>
            </div>
        </div>
    </div>
    <div id="items_section" class="items">
        <div class="box-title">所持品</div>
        <div class="box-content">
            <div class="equipment-wrapper">
              <div class="equipment-container">
                <div class="equipment-section">
                  <div class="equipment-item">
                    <label for="weapon1">武器1</label>
                    <div class="flex-group">
                      <select id="weapon1" v-model="equipments.weapon1.group" class="flex-item-1">
                        <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <input type="text" id="weapon1_name" v-model="equipments.weapon1.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
                    </div>
                  </div>
                  <div class="equipment-item">
                    <label for="weapon2">武器2</label>
                    <div class="flex-group">
                      <select id="weapon2" v-model="equipments.weapon2.group" class="flex-item-1">
                        <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <input type="text" id="weapon2_name" v-model="equipments.weapon2.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
                    </div>
                  </div>
                  <div class="equipment-item">
                    <label for="armor">防具</label>
                    <div class="flex-group">
                      <select id="armor" v-model="equipments.armor.group" class="flex-item-1">
                        <option v-for="option in AioniaGameData.armorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                      </select>
                      <input type="text" id="armor_name" v-model="equipments.armor.name" :placeholder="AioniaGameData.placeholderTexts.armorName" class="flex-item-2"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label for="other_items" class="block-label">その他所持品</label>
              <textarea id="other_items" class="items-textarea" v-model="character.otherItems"></textarea>
            </div>
        </div>
    </div>
    <div id="character_memo" class="character-memo">
        <div class="box-title">キャラクターメモ</div>
        <div class="box-content">
            <textarea id="character_text" :placeholder="AioniaGameData.placeholderTexts.characterMemo" v-model="character.memo" class="character-memo-textarea"></textarea>
        </div>
    </div>
    <div id="adventure_log_section" class="adventure-log-section">
        <div class="box-title">冒険の記録</div>
        <div class="box-content">
            <div class="base-list-header">
              <div class="delete-button-wrapper base-list-header-placeholder"></div>
              <div class="flex-grow">
                <div class="history-item-inputs">
                  <div class="flex-history-name"><label>シナリオ名</label></div>
                  <div class="flex-history-exp"><label>経験点</label></div>
                  <div class="flex-history-memo"><label>メモ</label></div>
                </div>
              </div>
            </div>
            <ul id="histories" class="list-reset">
              <li v-for="(history, index) in histories" :key="index" class="base-list-item">
                <div class="delete-button-wrapper">
                  <button
                    type="button"
                    class="button-base list-button list-button--delete"
                    @click="removeHistoryItem(index)"
                    :disabled="histories.length <= 1 && !hasHistoryContent(history)"
                    aria-label="冒険記録を削除"
                  >－</button>
                </div>
                <div class="flex-grow">
                  <div class="history-item-inputs">
                    <div class="flex-history-name">
                      <input type="text" v-model="history.sessionName" />
                    </div>
                    <div class="flex-history-exp">
                      <input type="number" v-model.number="history.gotExperiments" min="0"/>
                    </div>
                    <div class="flex-history-memo">
                      <input type="text" v-model="history.memo" />
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <div class="add-button-container-left">
              <button
                type="button"
                class="button-base list-button list-button--add"
                @click="addHistoryItem()"
                aria-label="冒険記録を追加"
              >＋</button>
            </div>
        </div>
    </div>
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
.hidden {
  display: none !important;
}
</style>
