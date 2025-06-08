const { createApp } = Vue;
// Global flags like window.gapiScriptLoaded are set by placeholder functions in index.html

import { UIManager } from './uiManager.js';
import * as listManager from './listManager.js'; // Imported as a namespace
import { GoogleDriveUIManager } from './googleDriveUIManager.js';
import { CharacterImageManager } from './characterImageManager.js';
import { CharacterSheetLogic } from './characterSheetLogic.js';

// Base character data copied from gameData with weaknesses initialized
const baseChar = deepClone(window.AioniaGameData.defaultCharacterData);
baseChar.weaknesses = createWeaknessArray(
  window.AioniaGameData.config.maxWeaknesses,
);

const app = createApp({
  data() {
    return {
      // Common Data
      gameData: window.AioniaGameData,
      dataManager: null,
      character: baseChar,
      skills: deepClone(window.AioniaGameData.baseSkills),
      externalSkillOrder: window.AioniaGameData.externalSkillOrder,
      initialSpecialSkillCount:
        window.AioniaGameData.config.initialSpecialSkillCount,
      specialSkills: Array(
        window.AioniaGameData.config.initialSpecialSkillCount,
      )
        .fill(null)
        .map(() => ({ group: "", name: "", note: "", showNote: false })),
      equipments: {
        weapon1: { group: "", name: "" },
        weapon2: { group: "", name: "" },
        armor: { group: "", name: "" },
      },
      histories: [{ sessionName: "", gotExperiments: null, memo: "" }],
      outputButtonText: window.AioniaGameData.uiMessages.outputButton.default,
      cocofoliaExporter: null,

      // Help Panel Data
      helpState: "closed", // 'closed', 'hovered', 'fixed'
      isDesktop: false,
      helpText: window.AioniaGameData.helpText,

      // Manager Instances
      uiManager: null,
      googleDriveUIManager: null,
      characterImageManager: null,
      characterSheetLogic: null,
      // listManager is functions-only, no instance needed in data

      // Google Drive Integration Data
      googleDriveManager: null, // This will be the instance from window.GoogleDriveManager
      isSignedIn: false,
      googleUser: null,
      driveFolderId: null,
      driveFolderName: "",
      currentDriveFileId: null,
      currentDriveFileName: "",
      driveStatusMessage: "",
      isGapiLoaded: false,
      isGisLoaded: false,
      isGapiInitialized: false,
      isGisInitialized: false,
      isCloudSaveSuccess: false,

      // Dropdown and Menu visibility
      showDriveMenu: false,
      currentDriveMenuHandler: null, // For the drive menu, managed by UIManager now
      helpPanelClickHandler: null, // For the help panel click outside handler

      // Image management
      currentImageIndex: 0, // Index for character.images array
      imageManagerInstance: null, // This will be window.ImageManager
    };
  },
  computed: {
    currentImageSrc() {
      if (
        this.character &&
        this.character.images &&
        this.character.images.length > 0 &&
        this.currentImageIndex >= 0 &&
        this.currentImageIndex < this.character.images.length
      ) {
        return this.character.images[this.currentImageIndex];
      }
      return null;
    },
    isHelpVisible() {
      return this.helpState !== "closed";
    },
    maxExperiencePoints() {
      const initialScarExp = Number(this.character.initialScar) || 0;
      const creationWeaknessExp = this.character.weaknesses.reduce(
        (sum, weakness) => {
          return (
            sum +
            (weakness.text &&
            weakness.text.trim() !== "" &&
            weakness.acquired === "作成時"
              ? this.gameData.experiencePointValues.weakness
              : 0)
          );
        },
        0,
      );
      const combinedInitialBonus = Math.min(
        initialScarExp + creationWeaknessExp,
        this.gameData.experiencePointValues.maxInitialBonus,
      );
      const historyExp = this.histories.reduce(
        (sum, h) => sum + (Number(h.gotExperiments) || 0),
        0,
      );
      return (
        this.gameData.experiencePointValues.basePoints +
        combinedInitialBonus +
        historyExp
      );
    },
    currentExperiencePoints() {
      let skillExp = this.skills.reduce(
        (sum, s) =>
          sum + (s.checked ? this.gameData.experiencePointValues.skillBase : 0),
        0,
      );
      let expertExp = this.skills.reduce((sum, s) => {
        if (s.checked && s.canHaveExperts) {
          return (
            sum +
            s.experts.reduce(
              (expSum, exp) =>
                expSum +
                (exp.value && exp.value.trim() !== ""
                  ? this.gameData.experiencePointValues.expertSkill
                  : 0),
              0,
            )
          );
        }
        return sum;
      }, 0);
      let specialSkillExp = this.specialSkills.reduce(
        (sum, ss) =>
          sum +
          (ss.name && ss.name.trim() !== ""
            ? this.gameData.experiencePointValues.specialSkill
            : 0),
        0,
      );
      return skillExp + expertExp + specialSkillExp;
    },
    currentWeight() {
      const weaponWeights = this.gameData.equipmentWeights.weapon;
      const armorWeights = this.gameData.equipmentWeights.armor;
      let weight = 0;
      weight += weaponWeights[this.equipments.weapon1.group] || 0;
      weight += weaponWeights[this.equipments.weapon2.group] || 0;
      weight += armorWeights[this.equipments.armor.group] || 0;
      return weight;
    },
    experienceStatusClass() {
      return this.currentExperiencePoints > this.maxExperiencePoints
        ? "status-display--experience-over"
        : "status-display--experience-ok";
    },
    sessionNamesForWeaknessDropdown() {
      const defaultOptions = [...this.gameData.weaknessAcquisitionOptions];
      const sessionOptions = this.histories
        .map((h) => h.sessionName)
        .filter((name) => name && name.trim() !== "")
        .map((name) => ({ value: name, text: name, disabled: false }));
      const helpOption = {
        value: "help-text",
        text: this.gameData.uiMessages.weaknessDropdownHelp,
        disabled: true,
      };
      return defaultOptions.concat(sessionOptions).concat(helpOption);
    },
    canSignInToGoogle() {
      return (
        this.isGapiInitialized && this.isGisInitialized && !this.isSignedIn
      );
    },
    canOperateDrive() {
      return this.isSignedIn && this.driveFolderId;
    },
  },
  watch: {
    // showDriveMenu watcher removed as its logic is now in UIManager.toggleDriveMenu
    "character.initialScar"(newInitialScar) {
      if (this.character.linkCurrentToInitialScar) {
        this.character.currentScar = newInitialScar;
      }
    },
    "character.linkCurrentToInitialScar"(isLinked) {
      if (isLinked) {
        this.character.currentScar = this.character.initialScar;
      }
    },
  },
  methods: {
    // --- Methods now calling UIManager ---
    handleHelpIconMouseOver() { this.uiManager.handleHelpIconMouseOver(); },
    handleHelpIconMouseLeave() { this.uiManager.handleHelpIconMouseLeave(); },
    handleHelpIconClick() { this.uiManager.handleHelpIconClick(); },
    closeHelpPanel() { this.uiManager.closeHelpPanel(); },
    toggleDriveMenu() { this.uiManager.toggleDriveMenu(); },

    // --- Methods now calling ListManager ---
    addSpecialSkillItem() { listManager.addSpecialSkillItem(this.specialSkills, this.gameData.config); },
    removeSpecialSkill(index) { listManager.removeSpecialSkill(this.specialSkills, index); },
    addExpert(skill) { listManager.addExpert(skill); },
    removeExpert(skill, expertIndex) { listManager.removeExpert(skill, expertIndex); },
    addHistoryItem() { listManager.addHistoryItem(this.histories); },
    removeHistoryItem(index) { listManager.removeHistoryItem(this.histories, index); },

    // --- Methods now calling GoogleDriveUIManager ---
    // Note: handleGapiLoaded and handleGisLoaded are called from mounted,
    // but good to have wrappers if they were ever needed elsewhere.
    handleGapiLoaded() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleGapiLoaded(); },
    handleGisLoaded() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleGisLoaded(); },
    handleSignInClick() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleSignInClick(); },
    handleSignOutClick() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleSignOutClick(); },
    getOrPromptForDriveFolder() { if (this.googleDriveUIManager) this.googleDriveUIManager.getOrPromptForDriveFolder(); },
    promptForDriveFolder(isDirectClick = true) { if (this.googleDriveUIManager) this.googleDriveUIManager.promptForDriveFolder(isDirectClick); },
    handleSaveToDriveClick() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleSaveToDriveClick(); },
    handleLoadFromDriveClick() { if (this.googleDriveUIManager) this.googleDriveUIManager.handleLoadFromDriveClick(); },

    // --- Methods now calling CharacterImageManager ---
    handleImageUpload(event) { if (this.characterImageManager) this.characterImageManager.handleImageUpload(event); },
    nextImage() { if (this.characterImageManager) this.characterImageManager.nextImage(); },
    previousImage() { if (this.characterImageManager) this.characterImageManager.previousImage(); },
    removeCurrentImage() { if (this.characterImageManager) this.characterImageManager.removeCurrentImage(); },

    // --- Methods now calling CharacterSheetLogic ---
    handleCurrentScarInput(event) { if (this.characterSheetLogic) this.characterSheetLogic.handleCurrentScarInput(event); },
    expertPlaceholder(skill) { return this.characterSheetLogic ? this.characterSheetLogic.expertPlaceholder(skill) : ""; },
    handleSpeciesChange() { if (this.characterSheetLogic) this.characterSheetLogic.handleSpeciesChange(); },
    availableSpecialSkillNames(index) { return this.characterSheetLogic ? this.characterSheetLogic.availableSpecialSkillNames(index) : []; },
    updateSpecialSkillOptions(index) { if (this.characterSheetLogic) this.characterSheetLogic.updateSpecialSkillOptions(index); },
    updateSpecialSkillNoteVisibility(index) { if (this.characterSheetLogic) this.characterSheetLogic.updateSpecialSkillNoteVisibility(index); },

    // --- Existing Core Methods (to remain in main.js) ---
    saveData() {
      this.dataManager.saveData(
        this.character,
        this.skills,
        this.specialSkills,
        this.equipments,
        this.histories,
      );
    },
    handleFileUpload(event) {
      this.dataManager.handleFileUpload(
        event,
        (parsedData) => {
          this.character = parsedData.character;
          this.skills = parsedData.skills;
          this.specialSkills = parsedData.specialSkills;
          this.equipments = parsedData.equipments;
          this.histories = parsedData.histories;
          this.currentDriveFileId = null; // Reset Drive file on local load
          this.currentDriveFileName = "";
        },
        (errorMessage) => {
          if (this.uiManager) this.uiManager.showCustomAlert(errorMessage); // Use UIManager
        },
      );
    },
    outputToCocofolia() {
      const exportData = {
        character: this.character,
        skills: this.skills,
        specialSkills: this.specialSkills,
        equipments: this.equipments,
        currentWeight: this.currentWeight,
        speciesLabelMap: this.gameData.speciesLabelMap,
        equipmentGroupLabelMap: this.gameData.equipmentGroupLabelMap,
        specialSkillData: this.gameData.specialSkillData,
        specialSkillsRequiringNote: this.gameData.specialSkillsRequiringNote,
        weaponDamage: this.gameData.weaponDamage,
        // Ensure all other necessary data for cocofoliaExporter is included here
      };
      const cocofoliaCharacter =
        this.cocofoliaExporter.generateCocofoliaData(exportData);
      const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
      if (this.uiManager) this.uiManager.copyToClipboard(textToCopy); // Use UIManager
    },
    // Methods that were moved are now replaced by wrappers above or removed.
  },
  mounted() {
    // Instantiate new managers
    this.uiManager = new UIManager(this);
    this.googleDriveUIManager = new GoogleDriveUIManager(this);
    this.characterImageManager = new CharacterImageManager(this);
    this.characterSheetLogic = new CharacterSheetLogic(this);

    // Existing initializations
    this.cocofoliaExporter = new window.CocofoliaExporter();
    this.dataManager = new window.DataManager(this.gameData);
    this.imageManagerInstance = window.ImageManager; // Used by CharacterImageManager
    window.vueApp = this; // Keep for now if external scripts rely on it

    // Initialize Help Panel & Link Scar (keep relevant parts)
    if (this.character.linkCurrentToInitialScar) {
      this.character.currentScar = this.character.initialScar;
    }
    this.isDesktop = !(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
    // Update global click listener for help panel
    this.$nextTick(() => {
      // Define the handler in a way that it can be removed.
      this.helpPanelClickHandler = (event) => this.uiManager.handleClickOutside(this, event);
      document.addEventListener("click", this.helpPanelClickHandler);
    });

    // Initialize Google Drive Manager (existing logic, but calls go to googleDriveUIManager)
    this.driveStatusMessage = "Initializing Google services...";
    if (window.GoogleDriveManager) {
      const apiKey = "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU"; // Keep actual keys
      const clientId =
        "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com";

      this.googleDriveManager = new window.GoogleDriveManager(apiKey, clientId); // This is the core Drive lib
      this.dataManager.setGoogleDriveManager(this.googleDriveManager); // dataManager needs the core lib

      // These will now call googleDriveUIManager methods
      if (window.gapiScriptLoaded) {
        if (this.googleDriveUIManager) this.googleDriveUIManager.handleGapiLoaded();
      }
      if (window.gisScriptLoaded) {
        if (this.googleDriveUIManager) this.googleDriveUIManager.handleGisLoaded();
      }
    } else {
      this.driveStatusMessage = "Error: Google Drive component failed to load.";
    }

    // Load saved folder from localStorage (existing logic)
    const savedFolderId = localStorage.getItem("aioniaDriveFolderId");
    const savedFolderName = localStorage.getItem("aioniaDriveFolderName");
    if (savedFolderId) {
      this.driveFolderId = savedFolderId;
      this.driveFolderName = savedFolderName || "Previously Selected Folder";
    }
  },
  beforeUnmount() {
    // Remove the specific listener correctly
    if (this.helpPanelClickHandler) {
      document.removeEventListener("click", this.helpPanelClickHandler);
    }
    // The driveMenu click-outside listener is now managed internally by UIManager.toggleDriveMenu's logic
    // which adds/removes this.app.currentDriveMenuHandler.
    // We need to ensure this specific handler is removed if it exists on the Vue instance when unmounting.
    if (this.currentDriveMenuHandler) {
       document.removeEventListener("click", this.currentDriveMenuHandler, true);
       this.currentDriveMenuHandler = null; // Clear it on the Vue instance too
    }
  },
});

app.mount("#app");
