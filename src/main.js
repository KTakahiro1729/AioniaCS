const { createApp } = Vue;
// Global flags like window.gapiScriptLoaded are set by placeholder functions in index.html

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

      // Google Drive Integration Data
      googleDriveManager: null,
      isSignedIn: false,
      googleUser: null,
      driveFolderId: null,
      driveFolderName: "",
      currentDriveFileId: null,
      currentDriveFileName: "",
      driveStatusMessage: "",
      isGapiLoaded: false,
      isGisLoaded: false,
      apiKey: "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU", // Placeholder
      clientId:
        "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com", // Placeholder
      isGapiInitialized: false,
      isGisInitialized: false,

      // Dropdown and Menu visibility
      showDriveMenu: false,
      showSaveDropdown: false,
      showLoadDropdown: false,
      currentDriveMenuHandler: null,
      currentSaveDropdownHandler: null,
      currentLoadDropdownHandler: null,

      // Image management
      currentImageIndex: 0,
      imageManagerInstance: null,
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
    showDriveMenu(newValue) {
      if (this.currentDriveMenuHandler) {
        document.removeEventListener(
          "click",
          this.currentDriveMenuHandler,
          true,
        );
        this.currentDriveMenuHandler = null;
      }
      if (newValue) {
        const menuElement = this.$refs.driveMenu;
        const toggleButton = this.$refs.driveMenuToggleButton;
        this.showSaveDropdown = false;
        this.showLoadDropdown = false;
        this.currentDriveMenuHandler = (event) => {
          if (
            menuElement &&
            !menuElement.contains(event.target) &&
            toggleButton &&
            !toggleButton.contains(event.target)
          ) {
            this.showDriveMenu = false;
          }
        };
        document.addEventListener("click", this.currentDriveMenuHandler, true);
      }
    },
    showSaveDropdown(newValue) {
      if (this.currentSaveDropdownHandler) {
        document.removeEventListener(
          "click",
          this.currentSaveDropdownHandler,
          true,
        );
        this.currentSaveDropdownHandler = null;
      }
      if (newValue) {
        const menuElement = this.$refs.saveDropdownMenu;
        const toggleButton = this.$refs.saveDropdownToggleButton;
        this.showDriveMenu = false;
        this.showLoadDropdown = false;
        this.currentSaveDropdownHandler = (event) => {
          if (
            menuElement &&
            !menuElement.contains(event.target) &&
            toggleButton &&
            !toggleButton.contains(event.target)
          ) {
            this.showSaveDropdown = false;
          }
        };
        document.addEventListener(
          "click",
          this.currentSaveDropdownHandler,
          true,
        );
      }
    },
    showLoadDropdown(newValue) {
      if (this.currentLoadDropdownHandler) {
        document.removeEventListener(
          "click",
          this.currentLoadDropdownHandler,
          true,
        );
        this.currentLoadDropdownHandler = null;
      }
      if (newValue) {
        const menuElement = this.$refs.loadDropdownMenu;
        const toggleButton = this.$refs.loadDropdownToggleButton;
        this.showDriveMenu = false;
        this.showSaveDropdown = false;
        this.currentLoadDropdownHandler = (event) => {
          if (
            menuElement &&
            !menuElement.contains(event.target) &&
            toggleButton &&
            !toggleButton.contains(event.target)
          ) {
            this.showLoadDropdown = false;
          }
        };
        document.addEventListener(
          "click",
          this.currentLoadDropdownHandler,
          true,
        );
      }
    },
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
    // Menu and Dropdown Toggle Methods
    toggleDriveMenu() {
      this.showDriveMenu = !this.showDriveMenu;
      if (this.showDriveMenu) {
        this.showSaveDropdown = false;
        this.showLoadDropdown = false;
      }
    },
    toggleSaveDropdown() {
      this.showSaveDropdown = !this.showSaveDropdown;
      if (this.showSaveDropdown) {
        this.showLoadDropdown = false;
        this.showDriveMenu = false;
      }
    },
    toggleLoadDropdown() {
      this.showLoadDropdown = !this.showLoadDropdown;
      if (this.showLoadDropdown) {
        this.showSaveDropdown = false;
        this.showDriveMenu = false;
      }
    },
    handleCurrentScarInput(event) {
      const enteredValue = parseInt(event.target.value, 10);
      if (isNaN(enteredValue)) {
        if (this.character.linkCurrentToInitialScar) {
          this.$nextTick(() => {
            this.character.currentScar = this.character.initialScar;
          });
        }
        return;
      }
      if (this.character.linkCurrentToInitialScar) {
        if (enteredValue !== this.character.initialScar) {
          this.character.linkCurrentToInitialScar = false;
          this.character.currentScar = enteredValue;
        }
      }
    },
    // --- Help Panel Methods ---
    handleHelpIconMouseOver() {
      if (this.isDesktop) {
        if (this.helpState === "closed") {
          this.helpState = "hovered";
        }
      }
    },
    handleHelpIconMouseLeave() {
      if (this.isDesktop) {
        if (this.helpState === "hovered") {
          this.helpState = "closed";
        }
      }
    },
    handleHelpIconClick() {
      if (this.isDesktop) {
        this.helpState = this.helpState === "fixed" ? "closed" : "fixed";
      } else {
        this.helpState = this.helpState === "closed" ? "fixed" : "closed";
      }
    },
    closeHelpPanel() {
      this.helpState = "closed";
    },
    handleClickOutside(event) {
      if (this.helpState === "fixed") {
        const helpPanelElement = this.$refs.helpPanel;
        const helpIconElement = this.$refs.helpIcon;
        if (helpPanelElement && helpIconElement) {
          if (
            !helpPanelElement.contains(event.target) &&
            !helpIconElement.contains(event.target)
          ) {
            this.helpState = "closed";
          }
        } else if (
          helpPanelElement &&
          !helpPanelElement.contains(event.target)
        ) {
          this.helpState = "closed";
        } else if (
          !helpPanelElement &&
          helpIconElement &&
          !helpIconElement.contains(event.target)
        ) {
          this.helpState = "closed";
        }
      }
    },
    // --- List Management Methods ---
    _manageListItem({
      list,
      action,
      index,
      newItemFactory,
      hasContentChecker,
      maxLength,
    }) {
      if (action === "add") {
        if (maxLength && list.length >= maxLength) {
          return;
        }
        const newItem =
          typeof newItemFactory === "function"
            ? newItemFactory()
            : newItemFactory;
        list.push(
          typeof newItem === "object" && newItem !== null
            ? window.deepClone(newItem)
            : newItem,
        );
      } else if (action === "remove") {
        if (list.length > 1) {
          list.splice(index, 1);
        } else if (
          list.length === 1 &&
          hasContentChecker &&
          hasContentChecker(list[index])
        ) {
          const emptyItem =
            typeof newItemFactory === "function"
              ? newItemFactory()
              : newItemFactory;
          list[index] =
            typeof emptyItem === "object" && emptyItem !== null
              ? window.deepClone(emptyItem)
              : emptyItem;
        }
      }
    },
    hasSpecialSkillContent(ss) {
      return !!(ss.group || ss.name || ss.note);
    },
    hasHistoryContent(h) {
      return !!(
        h.sessionName ||
        (h.gotExperiments !== null && h.gotExperiments !== "") ||
        h.memo
      );
    },
    addSpecialSkillItem() {
      this._manageListItem({
        list: this.specialSkills,
        action: "add",
        newItemFactory: () => ({
          group: "",
          name: "",
          note: "",
          showNote: false,
        }),
        maxLength: this.gameData.config.maxSpecialSkills,
      });
    },
    removeSpecialSkill(index) {
      this._manageListItem({
        list: this.specialSkills,
        action: "remove",
        index: index,
        newItemFactory: () => ({
          group: "",
          name: "",
          note: "",
          showNote: false,
        }),
        hasContentChecker: this.hasSpecialSkillContent,
      });
    },
    addExpert(skill) {
      if (skill.canHaveExperts) {
        this._manageListItem({
          list: skill.experts,
          action: "add",
          newItemFactory: () => ({ value: "" }),
        });
      }
    },
    removeExpert(skill, expertIndex) {
      this._manageListItem({
        list: skill.experts,
        action: "remove",
        index: expertIndex,
        newItemFactory: () => ({ value: "" }),
        hasContentChecker: (expert) =>
          expert.value && expert.value.trim() !== "",
      });
    },
    addHistoryItem() {
      this._manageListItem({
        list: this.histories,
        action: "add",
        newItemFactory: () => ({
          sessionName: "",
          gotExperiments: null,
          memo: "",
        }),
      });
    },
    removeHistoryItem(index) {
      this._manageListItem({
        list: this.histories,
        action: "remove",
        index: index,
        newItemFactory: () => ({
          sessionName: "",
          gotExperiments: null,
          memo: "",
        }),
        hasContentChecker: this.hasHistoryContent,
      });
    },
    // --- Data & UI Interaction Methods ---
    expertPlaceholder(skill) {
      return skill.checked
        ? this.gameData.placeholderTexts.expertSkill
        : this.gameData.placeholderTexts.expertSkillDisabled;
    },
    handleSpeciesChange() {
      if (this.character.species !== "other") {
        this.character.rareSpecies = "";
      }
    },
    availableSpecialSkillNames(index) {
      if (this.specialSkills[index]) {
        const group = this.specialSkills[index].group;
        return this.gameData.specialSkillData[group] || [];
      }
      return [];
    },
    updateSpecialSkillOptions(index) {
      if (this.specialSkills[index]) {
        this.specialSkills[index].name = "";
        this.updateSpecialSkillNoteVisibility(index);
      }
    },
    updateSpecialSkillNoteVisibility(index) {
      if (this.specialSkills[index]) {
        const skillName = this.specialSkills[index].name;
        this.specialSkills[index].showNote =
          this.gameData.specialSkillsRequiringNote.includes(skillName);
      }
    },
    saveData() {
      this.dataManager.saveData(
        this.character,
        this.skills,
        this.specialSkills,
        this.equipments,
        this.histories,
      );
      this.showSaveDropdown = false;
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
        },
        (errorMessage) => {
          this.showCustomAlert(errorMessage);
        },
      );
      this.showLoadDropdown = false;
    },

    // --- Cocofolia & Clipboard ---
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
      };
      const cocofoliaCharacter =
        this.cocofoliaExporter.generateCocofoliaData(exportData);
      const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
      this.copyToClipboard(textToCopy);
    },
    async copyToClipboard(text) {
      if (!navigator.clipboard) {
        this.fallbackCopyTextToClipboard(text);
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        this.playOutputAnimation();
      } catch (err) {
        console.error("Failed to copy: ", err);
        this.fallbackCopyTextToClipboard(text);
      }
    },
    fallbackCopyTextToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        if (successful) {
          this.playOutputAnimation();
        } else {
          this.outputButtonText = this.gameData.uiMessages.outputButton.failed;
          setTimeout(() => {
            this.outputButtonText =
              this.gameData.uiMessages.outputButton.default;
          }, 3000);
        }
      } catch (err) {
        console.error(err);
        this.outputButtonText = this.gameData.uiMessages.outputButton.error;
        setTimeout(() => {
          this.outputButtonText = this.gameData.uiMessages.outputButton.default;
        }, 3000);
      }
      document.body.removeChild(textArea);
    },
    playOutputAnimation() {
      const button = this.$refs.outputButton;
      if (!button || button.classList.contains("is-animating")) {
        return;
      }
      const buttonMessages = this.gameData.uiMessages.outputButton;
      const timings = buttonMessages.animationTimings;
      const originalText = buttonMessages.default;
      const newText = buttonMessages.animating;
      button.classList.add("is-animating");
      const timeForState2 = timings.state1_bgFill;
      const timeForState3 = timeForState2 + timings.state2_textHold;
      const timeForState4 = timeForState3 + timings.state3_textFadeOut;
      const timeForCleanup = timeForState4 + timings.state4_bgReset;

      button.classList.add("state-1");
      setTimeout(() => {
        button.classList.remove("state-1");
        this.outputButtonText = newText;
        button.classList.add("state-2");
      }, timeForState2);
      setTimeout(() => {
        button.classList.remove("state-2");
        button.classList.add("state-3");
      }, timeForState3);
      setTimeout(() => {
        button.classList.remove("state-3");
        this.outputButtonText = originalText;
        button.classList.add("state-4");
      }, timeForState4);
      setTimeout(() => {
        button.classList.remove("is-animating", "state-4");
      }, timeForCleanup);
    },
    showCustomAlert(message) {
      const alertModalId = "custom-alert-modal";
      let modal = document.getElementById(alertModalId);
      if (!modal) {
        modal = document.createElement("div");
        modal.id = alertModalId;
        modal.classList.add("custom-alert-modal");
        const messageP = document.createElement("p");
        messageP.classList.add("custom-alert-message");
        modal.appendChild(messageP);
        const closeButton = document.createElement("button");
        closeButton.textContent = "OK";
        closeButton.classList.add("custom-alert-button");
        closeButton.onclick = () => modal.remove();
        modal.appendChild(closeButton);
        document.body.appendChild(modal);
      }
      modal.querySelector("p").textContent = message;
      modal.style.display = "block";
    },

    // --- Google Drive Methods ---
    async handleGapiLoaded() {
      if (this.isGapiInitialized || !this.googleDriveManager) return;
      this.isGapiInitialized = true;
      this.isGapiLoaded = true;
      this.driveStatusMessage = "Google API Client: Loading...";
      try {
        await this.googleDriveManager.onGapiLoad();
        this.driveStatusMessage = this.isSignedIn
          ? `Signed in. Folder: ${this.driveFolderName || "Not selected"}`
          : "Google API Client: Ready. Please sign in.";
      } catch (err) {
        this.driveStatusMessage = "Google API Client: Error initializing.";
        console.error("GAPI client init error in Vue app:", err);
      }
    },
    async handleGisLoaded() {
      if (this.isGisInitialized || !this.googleDriveManager) return;
      this.isGisInitialized = true;
      this.isGisLoaded = true;
      this.driveStatusMessage = "Google Sign-In: Loading...";
      try {
        await this.googleDriveManager.onGisLoad();
        this.driveStatusMessage = this.isSignedIn
          ? `Signed in. Folder: ${this.driveFolderName || "Not selected"}`
          : "Google Sign-In: Ready. Please sign in.";
      } catch (err) {
        this.driveStatusMessage = "Google Sign-In: Error initializing.";
        console.error("GIS client init error in Vue app:", err);
      }
    },
    async handleSignInClick() {
      this.showDriveMenu = false;
      if (!this.googleDriveManager) {
        this.driveStatusMessage = "Error: Drive Manager not available.";
        return;
      }
      this.driveStatusMessage = "Signing in... Please wait.";
      try {
        this.googleDriveManager.handleSignIn((error, authResult) => {
          if (error || !authResult || !authResult.signedIn) {
            this.isSignedIn = false;
            this.googleUser = null;
            this.driveStatusMessage =
              "Sign-in failed. " +
              (error
                ? error.message || error.details || "Please try again."
                : "Ensure pop-ups are enabled.");
          } else {
            this.isSignedIn = true;
            this.googleUser = { displayName: "User" };
            this.driveStatusMessage = `Signed in. Folder: ${this.driveFolderName || "Not selected"}`;
            if (!this.driveFolderId) {
              this.getOrPromptForDriveFolder();
            }
          }
        });
      } catch (err) {
        this.isSignedIn = false;
        this.googleUser = null;
        this.driveStatusMessage =
          "Sign-in error: " + (err.message || "An unexpected error occurred.");
      }
    },
    handleSignOutClick() {
      this.showDriveMenu = false;
      if (!this.googleDriveManager) {
        this.driveStatusMessage = "Error: Drive Manager not available.";
        return;
      }
      this.driveStatusMessage = "Signing out...";
      this.googleDriveManager.handleSignOut(() => {
        this.isSignedIn = false;
        this.googleUser = null;
        this.currentDriveFileId = null;
        this.currentDriveFileName = "";
        this.driveStatusMessage = "Signed out.";
      });
    },
    async getOrPromptForDriveFolder() {
      this.showDriveMenu = false;
      if (!this.isSignedIn || !this.googleDriveManager) {
        this.driveStatusMessage = "Error: Please sign in first.";
        return;
      }
      this.driveStatusMessage = "Accessing Google Drive folder...";
      const appFolderName = "AioniaCS_Data";
      try {
        const folderInfo =
          await this.googleDriveManager.getOrCreateAppFolder(appFolderName);
        if (folderInfo && folderInfo.id) {
          this.driveFolderId = folderInfo.id;
          this.driveFolderName = folderInfo.name;
          localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
          localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
          this.driveStatusMessage = `Drive Folder: ${this.driveFolderName}`;
        } else {
          this.driveStatusMessage =
            "Could not auto-setup Drive folder. Please choose one.";
          await this.promptForDriveFolder(false);
        }
      } catch (error) {
        this.driveStatusMessage = `Folder setup error: ${error.message || "Please choose manually."}`;
        await this.promptForDriveFolder(false);
      }
    },
    async promptForDriveFolder(isDirectClick = true) {
      if (isDirectClick) this.showDriveMenu = false;
      if (!this.isSignedIn || !this.googleDriveManager) {
        this.driveStatusMessage = "Error: Please sign in first.";
        return;
      }
      this.driveStatusMessage = "Opening Google Drive folder picker...";
      this.googleDriveManager.showFolderPicker((error, folder) => {
        if (error) {
          this.driveStatusMessage = `Folder selection error: ${error.message || "Cancelled or failed."}`;
        } else if (folder && folder.id) {
          this.driveFolderId = folder.id;
          this.driveFolderName = folder.name;
          localStorage.setItem("aioniaDriveFolderId", folder.id);
          localStorage.setItem("aioniaDriveFolderName", folder.name);
          this.driveStatusMessage = `Drive Folder: ${this.driveFolderName}`;
          this.currentDriveFileId = null;
          this.currentDriveFileName = "";
        } else {
          this.driveStatusMessage = this.driveFolderId
            ? `Drive Folder: ${this.driveFolderName}`
            : "Folder selection cancelled.";
        }
      });
    },
    async handleSaveToDriveClick() {
      this.showSaveDropdown = false;
      if (!this.isSignedIn || !this.googleDriveManager) {
        this.driveStatusMessage = "Error: Please sign in to save.";
        return;
      }
      if (!this.driveFolderId) {
        this.driveStatusMessage =
          "Drive folder not set. Please choose a folder first.";
        await this.promptForDriveFolder(false);
        if (!this.driveFolderId) {
          this.driveStatusMessage = "Save cancelled: No Drive folder selected.";
          return;
        }
      }
      this.driveStatusMessage = `Saving to "${this.driveFolderName}"...`;
      const fileName =
        (this.character.name || "Aionia_Character_Sheet").replace(
          /[\\/:*?"<>|]/g,
          "_",
        ) + ".json";
      try {
        const savedFile = await this.dataManager.saveDataToDrive(
          this.character,
          this.skills,
          this.specialSkills,
          this.equipments,
          this.histories,
          this.driveFolderId,
          this.currentDriveFileId,
          fileName,
        );
        if (savedFile && savedFile.id) {
          this.currentDriveFileId = savedFile.id;
          this.currentDriveFileName = savedFile.name;
          this.driveStatusMessage = `Saved: ${this.currentDriveFileName} to "${this.driveFolderName}".`;
        } else {
          throw new Error(
            "Save operation did not return expected file information.",
          );
        }
      } catch (error) {
        this.driveStatusMessage = `Save error: ${error.message || "Unknown error"}`;
      }
    },
    async handleLoadFromDriveClick() {
      this.showLoadDropdown = false;
      if (!this.isSignedIn || !this.googleDriveManager) {
        this.driveStatusMessage = "Error: Please sign in to load.";
        return;
      }
      this.driveStatusMessage = "Opening Google Drive file picker...";
      this.googleDriveManager.showFilePicker(
        async (error, file) => {
          if (error) {
            this.driveStatusMessage = `File selection error: ${error.message || "Cancelled or failed."}`;
            return;
          }
          if (!file || !file.id) {
            this.driveStatusMessage =
              "File selection cancelled or no file chosen.";
            return;
          }
          this.driveStatusMessage = `Loading ${file.name} from Drive...`;
          try {
            const parsedData = await this.dataManager.loadDataFromDrive(
              file.id,
            );
            if (parsedData) {
              this.character = parsedData.character;
              this.skills = parsedData.skills;
              this.specialSkills = parsedData.specialSkills;
              this.equipments = parsedData.equipments;
              this.histories = parsedData.histories;
              this.currentDriveFileId = file.id;
              this.currentDriveFileName = file.name;
              this.driveStatusMessage = `Loaded: ${this.currentDriveFileName} from Drive.`;
            } else {
              throw new Error("Load operation did not return data.");
            }
          } catch (err) {
            this.driveStatusMessage = `Load error for ${file.name || "file"}: ${err.message || "Unknown error"}`;
          }
        },
        this.driveFolderId || null,
        ["application/json"],
      );
    },

    // --- Image Management Methods ---
    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      if (!this.imageManagerInstance) {
        console.error("ImageManager not initialized");
        return;
      }
      try {
        const imageData = await this.imageManagerInstance.loadImage(file);
        if (!this.character.images) {
          this.character.images = [];
        }
        this.character.images.push(imageData);
        this.currentImageIndex = this.character.images.length - 1;
      } catch (error) {
        console.error("Error loading image:", error);
        this.showCustomAlert("画像の読み込みに失敗しました：" + error.message);
      } finally {
        event.target.value = null;
      }
    },
    nextImage() {
      if (
        this.character &&
        this.character.images &&
        this.character.images.length > 0
      ) {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % this.character.images.length;
      }
    },
    previousImage() {
      if (
        this.character &&
        this.character.images &&
        this.character.images.length > 0
      ) {
        this.currentImageIndex =
          (this.currentImageIndex - 1 + this.character.images.length) %
          this.character.images.length;
      }
    },
    removeCurrentImage() {
      if (
        this.character &&
        this.character.images &&
        this.character.images.length > 0 &&
        this.currentImageIndex >= 0 &&
        this.currentImageIndex < this.character.images.length
      ) {
        this.character.images.splice(this.currentImageIndex, 1);
        if (this.character.images.length === 0) {
          this.currentImageIndex = -1;
        } else if (this.currentImageIndex >= this.character.images.length) {
          this.currentImageIndex = this.character.images.length - 1;
        }
      }
    },
  },
  mounted() {
    this.cocofoliaExporter = new window.CocofoliaExporter();
    this.dataManager = new window.DataManager(this.gameData);
    this.imageManagerInstance = window.ImageManager;
    window.vueApp = this;

    // Initialize Help Panel & Link Scar
    if (this.character.linkCurrentToInitialScar) {
      this.character.currentScar = this.character.initialScar;
    }
    this.isDesktop = !(
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
    this.$nextTick(() => {
      document.addEventListener("click", this.handleClickOutside);
    });

    // Initialize Google Drive Manager
    this.driveStatusMessage = "Initializing Google services...";
    if (window.GoogleDriveManager) {
      this.googleDriveManager = new window.GoogleDriveManager(
        this.apiKey,
        this.clientId,
      );
      this.dataManager.setGoogleDriveManager(this.googleDriveManager);
      if (window.gapiScriptLoaded) {
        this.handleGapiLoaded();
      }
      if (window.gisScriptLoaded) {
        this.handleGisLoaded();
      }
    } else {
      this.driveStatusMessage = "Error: Google Drive component failed to load.";
    }

    // Load saved folder from localStorage
    const savedFolderId = localStorage.getItem("aioniaDriveFolderId");
    const savedFolderName = localStorage.getItem("aioniaDriveFolderName");
    if (savedFolderId) {
      this.driveFolderId = savedFolderId;
      this.driveFolderName = savedFolderName || "Previously Selected Folder";
    }
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
    if (this.currentDriveMenuHandler)
      document.removeEventListener("click", this.currentDriveMenuHandler, true);
    if (this.currentSaveDropdownHandler)
      document.removeEventListener(
        "click",
        this.currentSaveDropdownHandler,
        true,
      );
    if (this.currentLoadDropdownHandler)
      document.removeEventListener(
        "click",
        this.currentLoadDropdownHandler,
        true,
      );
  },
});

app.mount("#app");
