const { createApp } = Vue;
// Global flags like window.gapiScriptLoaded are set by placeholder functions in index.html

// Base character data copied from gameData with weaknesses initialized
const baseChar = deepClone(window.AioniaGameData.defaultCharacterData);
baseChar.weaknesses = createWeaknessArray(
    window.AioniaGameData.config.maxWeaknesses
);

const app = createApp({
    data() {
        return {
            // gameData.jsへの参照を追加
            gameData: window.AioniaGameData,
            dataManager: null,
            character: baseChar,
            skills: deepClone(window.AioniaGameData.baseSkills),
            externalSkillOrder: window.AioniaGameData.externalSkillOrder,
            initialSpecialSkillCount: window.AioniaGameData.config.initialSpecialSkillCount,
            specialSkills: Array(window.AioniaGameData.config.initialSpecialSkillCount).fill(null).map(() => ({ group: '', name: '', note: '', showNote: false })),
            equipments: {
                weapon1: { group: '', name: '' },
                weapon2: { group: '', name: '' },
                armor: { group: '', name: '' },
            },
            histories: [
                { sessionName: '', gotExperiments: null, memo: '' }
            ],
            showHelp: false,
            helpText: window.AioniaGameData.helpText,
            outputButtonText: window.AioniaGameData.uiMessages.outputButton.default,
            cocofoliaExporter: null,

            // Google Drive Integration Data Properties
            googleDriveManager: null,
            isSignedIn: false,
            googleUser: null,
            driveFolderId: null,
            driveFolderName: '',
            currentDriveFileId: null,
            currentDriveFileName: '',
            driveStatusMessage: '',
            isGapiLoaded: false,
            isGisLoaded: false,
            // IMPORTANT: Replace with your actual API Key and Client ID
            apiKey: 'AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU',
            clientId: '913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com',
            isGapiInitialized: false, // To prevent multiple GAPI initializations
            isGisInitialized: false,  // To prevent multiple GIS initializations
            showDriveMenu: false, // Controls visibility of the Google Drive floating menu
            showSaveDropdown: false, // Controls visibility of the Save dropdown menu
            showLoadDropdown: false, // Controls visibility of the Load dropdown menu

            // Bound event handlers for outside click
            boundCloseDriveMenuHandler: null,
            boundCloseSaveDropdownHandler: null,
            boundCloseLoadDropdownHandler: null,

            // Image management
            currentImageIndex: 0, // Index of the currently displayed image
            imageManagerInstance: null, // Instance of ImageManager
        };
    },
    computed: {
        currentImageSrc() {
            if (this.character && this.character.images && this.character.images.length > 0 && this.currentImageIndex >= 0 && this.currentImageIndex < this.character.images.length) {
                return this.character.images[this.currentImageIndex];
            }
            return null; // Or a placeholder image path
        },
        maxExperiencePoints() {
            const initialScarExp = Number(this.character.initialScar) || 0;
            const creationWeaknessExp = this.character.weaknesses.reduce((sum, weakness) => {
                return sum + (weakness.text && weakness.text.trim() !== '' && weakness.acquired === '作成時' ? this.gameData.experiencePointValues.weakness : 0);
            }, 0);
            const combinedInitialBonus = Math.min(initialScarExp + creationWeaknessExp, this.gameData.experiencePointValues.maxInitialBonus);
            const historyExp = this.histories.reduce((sum, h) => sum + (Number(h.gotExperiments) || 0), 0);
            return this.gameData.experiencePointValues.basePoints + combinedInitialBonus + historyExp;
        },
        currentExperiencePoints() {
            let skillExp = this.skills.reduce((sum, s) => sum + (s.checked ? this.gameData.experiencePointValues.skillBase : 0), 0);
            let expertExp = this.skills.reduce((sum, s) => {
                if (s.checked && s.canHaveExperts) {
                    return sum + s.experts.reduce((expSum, exp) => expSum + (exp.value && exp.value.trim() !== '' ? this.gameData.experiencePointValues.expertSkill : 0), 0);
                }
                return sum;
            }, 0);
            let specialSkillExp = this.specialSkills.reduce((sum, ss) => sum + (ss.name && ss.name.trim() !== '' ? this.gameData.experiencePointValues.specialSkill : 0), 0);
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
            return this.currentExperiencePoints > this.maxExperiencePoints ? 'status-display--experience-over' : 'status-display--experience-ok';
        },
        sessionNamesForWeaknessDropdown() {
            const defaultOptions = [...this.gameData.weaknessAcquisitionOptions];
            const sessionOptions = this.histories
                .map(h => h.sessionName)
                .filter(name => name && name.trim() !== '')
                .map(name => ({ value: name, text: name, disabled: false }));
            const helpOption = { value: 'help-text', text: this.gameData.uiMessages.weaknessDropdownHelp, disabled: true };
            return defaultOptions.concat(sessionOptions).concat(helpOption);
        },
        canSignInToGoogle() {
            return this.isGapiInitialized && this.isGisInitialized && !this.isSignedIn;
        },
        canOperateDrive() {
            return this.isSignedIn && this.driveFolderId;
        }
    },
    watch: {
        showDriveMenu(newValue) {
            if (newValue) {
                document.addEventListener('click', this.boundCloseDriveMenuHandler, true);
            } else {
                document.removeEventListener('click', this.boundCloseDriveMenuHandler, true);
            }
        },
        showSaveDropdown(newValue) {
            if (newValue) {
                document.addEventListener('click', this.boundCloseSaveDropdownHandler, true);
            } else {
                document.removeEventListener('click', this.boundCloseSaveDropdownHandler, true);
            }
        },
        showLoadDropdown(newValue) {
            if (newValue) {
                document.addEventListener('click', this.boundCloseLoadDropdownHandler, true);
            } else {
                document.removeEventListener('click', this.boundCloseLoadDropdownHandler, true);
            }
        },
        'character.initialScar'(newInitialScar) {
            if (this.character.linkCurrentToInitialScar) {
                this.character.currentScar = newInitialScar;
            }
        },
        'character.linkCurrentToInitialScar'(isLinked) {
            if (isLinked) {
                this.character.currentScar = this.character.initialScar;
            }
        }
    },
    methods: {
        // Menu and Dropdown Toggle Methods
        toggleDriveMenu() { // Renamed for clarity from implicit toggle in HTML
            this.showDriveMenu = !this.showDriveMenu;
        },
        toggleSaveDropdown() {
            this.showSaveDropdown = !this.showSaveDropdown;
            if (this.showSaveDropdown) { // When opening, ensure others are closed
                this.showLoadDropdown = false;
                this.showDriveMenu = false;
            }
        },
        toggleLoadDropdown() {
            this.showLoadDropdown = !this.showLoadDropdown;
            if (this.showLoadDropdown) { // When opening, ensure others are closed
                this.showLoadDropdown = false; // Close other dropdown
            }
        },
        toggleLoadDropdown() {
            this.showLoadDropdown = !this.showLoadDropdown;
                this.showSaveDropdown = false;
                this.showDriveMenu = false;
            }
        },

        // Outside Click Handlers
        closeDriveMenuHandler(event) {
            // Check if the click is outside the menu and its toggle button
            // Assumes toggle button has a ref or specific ID/class. For now, let's use a class 'icon-button'
            const menuElement = this.$el.querySelector('.floating-menu'); // More robust: use refs
            const toggleButton = this.$el.querySelector('.top-left-controls .icon-button');
            if (menuElement && !menuElement.contains(event.target) && toggleButton && !toggleButton.contains(event.target)) {
                this.showDriveMenu = false;
            }
        },
        closeSaveDropdownHandler(event) {
            const menuElement = this.$el.querySelector('.footer-button-container:nth-child(1) .footer-dropdown-menu'); // Nth child is fragile
            const toggleButton = this.$el.querySelector('.footer-button-container:nth-child(1) .footer-button--dropdown-arrow');
             if (menuElement && !menuElement.contains(event.target) && toggleButton && !toggleButton.contains(event.target)) {
                this.showSaveDropdown = false;
            }
        },
        closeLoadDropdownHandler(event) {
            const menuElement = this.$el.querySelector('.footer-button-container:nth-child(2) .footer-dropdown-menu'); // Nth child is fragile
            const toggleButton = this.$el.querySelector('.footer-button-container:nth-child(2) .footer-button--dropdown-arrow');
            if (menuElement && !menuElement.contains(event.target) && toggleButton && !toggleButton.contains(event.target)) {
                this.showLoadDropdown = false;
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
        toggleHelp() { this.showHelp = !this.showHelp; },
        hasSpecialSkillContent(ss) { return !!(ss.group || ss.name || ss.note); },
        hasHistoryContent(h) { return !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo); },

        addSpecialSkillItem() {
            if (this.specialSkills.length < this.gameData.config.maxSpecialSkills) {
                this.specialSkills.push({ group: '', name: '', note: '', showNote: false });
            }
        },
        removeSpecialSkill(index) {
            if (this.specialSkills.length > 1) {
                this.specialSkills.splice(index, 1);
            } else if (this.specialSkills.length === 1 && this.hasSpecialSkillContent(this.specialSkills[index])) {
                this.specialSkills[index] = { group: '', name: '', note: '', showNote: false };
            }
        },
        expertPlaceholder(skill) {
            return skill.checked ? this.gameData.placeholderTexts.expertSkill : this.gameData.placeholderTexts.expertSkillDisabled;
        },
        handleSpeciesChange() {
            if (this.character.species !== 'other') {
                this.character.rareSpecies = '';
            }
        },
        addExpert(skill) { if (skill.canHaveExperts) { skill.experts.push({ value: '' }); } },
        removeExpert(skill, expertIndex) {
            if (skill.experts.length > 1) {
                skill.experts.splice(expertIndex, 1);
            } else if (skill.experts.length === 1 && skill.experts[expertIndex].value !== '') {
                skill.experts[expertIndex].value = '';
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
                this.specialSkills[index].name = '';
                this.updateSpecialSkillNoteVisibility(index);
            }
        },
        updateSpecialSkillNoteVisibility(index) {
            if (this.specialSkills[index]) {
                const skillName = this.specialSkills[index].name;
                this.specialSkills[index].showNote = this.gameData.specialSkillsRequiringNote.includes(skillName);
            }
        },
        addHistoryItem() { this.histories.push({ sessionName: '', gotExperiments: null, memo: '' }); },
        removeHistoryItem(index) {
            if (this.histories.length > 1) {
                this.histories.splice(index, 1);
            } else if (this.histories.length === 1 && this.hasHistoryContent(this.histories[index])) {
                this.histories[index] = { sessionName: '', gotExperiments: null, memo: '' };
            }
        },
        // saveData now specifically refers to local save
        saveData() {
            this.dataManager.saveData( // This method in dataManager handles local file download
                this.character,
                this.skills,
                this.specialSkills,
                this.equipments,
                this.histories
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
                },
                (errorMessage) => {
                    this.showCustomAlert(errorMessage);
                }
            );
            // Ensure dropdowns are closed after action
            this.showSaveDropdown = false;
            this.showLoadDropdown = false;
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
                weaponDamage: this.gameData.weaponDamage
            };

            const cocofoliaCharacter = this.cocofoliaExporter.generateCocofoliaData(exportData);

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
                this.setOutputButtonSuccess();
            } catch (err) {
                console.error('Failed to copy: ', err);
                this.fallbackCopyTextToClipboard(text);
            }
        },

        flashOutputButtonMessage(key) {
            this.outputButtonText = this.gameData.uiMessages.outputButton[key];
            setTimeout(() => {
                this.outputButtonText = this.gameData.uiMessages.outputButton.default;
            }, 3000);
        },

        setOutputButtonSuccess() {
            this.flashOutputButtonMessage('success');
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
                const successful = document.execCommand('copy');
                if (successful) {
                    this.flashOutputButtonMessage('successFallback');
                } else {
                    this.flashOutputButtonMessage('failed');
                }
            } catch (err) {
                console.error(err);
                this.flashOutputButtonMessage('error');
            }

            document.body.removeChild(textArea);
        },

        showCustomAlert(message) {
            const alertModalId = 'custom-alert-modal';
            let modal = document.getElementById(alertModalId);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = alertModalId;
                modal.classList.add('custom-alert-modal'); // CSSクラスを追加

                const messageP = document.createElement('p');
                messageP.classList.add('custom-alert-message'); // CSSクラスを追加
                modal.appendChild(messageP);

                const closeButton = document.createElement('button');
                closeButton.textContent = 'OK';
                closeButton.classList.add('custom-alert-button'); // CSSクラスを追加
                closeButton.onclick = () => modal.remove();
                modal.appendChild(closeButton);
                document.body.appendChild(modal);
            }
            modal.querySelector('p').textContent = message;
            modal.style.display = 'block';
        },
        async handleGapiLoaded() {
            if (this.isGapiInitialized || !this.googleDriveManager) return;
            this.isGapiInitialized = true;
            this.isGapiLoaded = true;
            this.driveStatusMessage = 'Google API Client: Loading...';
            console.log("Vue app: handleGapiLoaded triggered.");
            try {
                await this.googleDriveManager.onGapiLoad();
                this.driveStatusMessage = this.isSignedIn ? `Signed in. Folder: ${this.driveFolderName || 'Not selected'}` : 'Google API Client: Ready. Please sign in.';
                console.log('Google API client initialized successfully in Vue.');
            } catch (err) {
                this.driveStatusMessage = 'Google API Client: Error initializing.';
                console.error('GAPI client init error in Vue app:', err);
            }
        },
        async handleGisLoaded() {
            if (this.isGisInitialized || !this.googleDriveManager) return;
            this.isGisInitialized = true;
            this.isGisLoaded = true;
            this.driveStatusMessage = 'Google Sign-In: Loading...';
            console.log("Vue app: handleGisLoaded triggered.");
            try {
                await this.googleDriveManager.onGisLoad();
                this.driveStatusMessage = this.isSignedIn ? `Signed in. Folder: ${this.driveFolderName || 'Not selected'}` : 'Google Sign-In: Ready. Please sign in.';
                console.log('Google Sign-In initialized successfully in Vue.');
            } catch (err) {
                this.driveStatusMessage = 'Google Sign-In: Error initializing.';
                console.error('GIS client init error in Vue app:', err);
            }
        },
        async handleSignInClick() {
            this.showDriveMenu = false; // Close menu on action
            if (!this.googleDriveManager) {
                this.driveStatusMessage = "Error: Drive Manager not available.";
                return;
            }
            this.driveStatusMessage = 'Signing in... Please wait.';
            try {
                this.googleDriveManager.handleSignIn((error, authResult) => {
                    if (error || !authResult || !authResult.signedIn) {
                        this.isSignedIn = false;
                        this.googleUser = null;
                        this.driveStatusMessage = 'Sign-in failed. ' + (error ? (error.message || error.details || 'Please try again.') : 'Ensure pop-ups are enabled.');
                        console.error("Sign-in error or not signed in:", error, authResult);
                    } else {
                        this.isSignedIn = true;
                        this.googleUser = { displayName: 'User' }; // Placeholder, actual name needs People API
                        this.driveStatusMessage = `Signed in. Folder: ${this.driveFolderName || 'Not selected'}`;
                        console.log("Sign-in successful.");
                        if (!this.driveFolderId) {
                            this.getOrPromptForDriveFolder();
                        }
                    }
                });
            } catch (err) {
                this.isSignedIn = false;
                this.googleUser = null;
                this.driveStatusMessage = 'Sign-in error: ' + (err.message || 'An unexpected error occurred.');
                console.error("Exception during signIn:", err);
            }
        },
        handleSignOutClick() {
            this.showDriveMenu = false; // Close menu on action
            if (!this.googleDriveManager) {
                this.driveStatusMessage = "Error: Drive Manager not available.";
                return;
            }
            this.driveStatusMessage = 'Signing out...';
            this.googleDriveManager.handleSignOut(() => {
                this.isSignedIn = false;
                this.googleUser = null;
                this.currentDriveFileId = null;
                this.currentDriveFileName = '';
                // Keep driveFolderId and driveFolderName from localStorage unless explicitly cleared
                this.driveStatusMessage = 'Signed out.';
                console.log("Sign-out complete.");
            });
        },
        async getOrPromptForDriveFolder() {
            this.showDriveMenu = false; // Close menu on action
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Error: Please sign in first.";
                return;
            }
            this.driveStatusMessage = 'Accessing Google Drive folder...';
            const appFolderName = 'AioniaCS_Data';

            try {
                const folderInfo = await this.googleDriveManager.getOrCreateAppFolder(appFolderName);
                if (folderInfo && folderInfo.id) {
                    this.driveFolderId = folderInfo.id;
                    this.driveFolderName = folderInfo.name;
                    localStorage.setItem('aioniaDriveFolderId', folderInfo.id);
                    localStorage.setItem('aioniaDriveFolderName', folderInfo.name);
                    this.driveStatusMessage = `Drive Folder: ${this.driveFolderName}`;
                } else {
                    this.driveStatusMessage = 'Could not auto-setup Drive folder. Please choose one.';
                    await this.promptForDriveFolder(false); // Pass false as it's not a direct user click
                }
            } catch (error) {
                console.error("Error in getOrPromptForDriveFolder:", error);
                this.driveStatusMessage = `Folder setup error: ${error.message || 'Please choose manually.'}`;
                await this.promptForDriveFolder(false);
            }
        },
        async promptForDriveFolder(isDirectClick = true) {
            if(isDirectClick) this.showDriveMenu = false; // Close menu on action if directly clicked
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Error: Please sign in first.";
                return;
            }
            this.driveStatusMessage = 'Opening Google Drive folder picker...';
            this.googleDriveManager.showFolderPicker((error, folder) => {
                if (error) {
                    this.driveStatusMessage = `Folder selection error: ${error.message || 'Cancelled or failed.'}`;
                    console.warn("Folder selection error:", error);
                } else if (folder && folder.id) {
                    this.driveFolderId = folder.id;
                    this.driveFolderName = folder.name;
                    localStorage.setItem('aioniaDriveFolderId', folder.id);
                    localStorage.setItem('aioniaDriveFolderName', folder.name);
                    this.driveStatusMessage = `Drive Folder: ${this.driveFolderName}`;
                    this.currentDriveFileId = null;
                    this.currentDriveFileName = '';
                    console.log("Folder selected:", folder);
                } else {
                    this.driveStatusMessage = this.driveFolderId ? `Drive Folder: ${this.driveFolderName}` : 'Folder selection cancelled.';
                }
            });
        },
        async handleSaveToDriveClick() {
            this.showSaveDropdown = false; // Close dropdown
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Error: Please sign in to save.";
                return;
            }
            if (!this.driveFolderId) {
                this.driveStatusMessage = "Drive folder not set. Please choose a folder first.";
                await this.promptForDriveFolder(false); // Prompt for folder
                if (!this.driveFolderId) {
                    this.driveStatusMessage = "Save cancelled: No Drive folder selected.";
                    return;
                }
            }

            this.driveStatusMessage = `Saving to "${this.driveFolderName}"...`;
            const fileName = (this.character.name || 'Aionia_Character_Sheet').replace(/[\\/:*?"<>|]/g, '_') + '.json';

            try {
                const savedFile = await this.dataManager.saveDataToDrive(
                    this.character, this.skills, this.specialSkills, this.equipments, this.histories,
                    this.driveFolderId, this.currentDriveFileId, fileName
                );
                if (savedFile && savedFile.id) {
                    this.currentDriveFileId = savedFile.id;
                    this.currentDriveFileName = savedFile.name; // Store the actual name used by Drive
                    this.driveStatusMessage = `Saved: ${this.currentDriveFileName} to "${this.driveFolderName}".`;
                    console.log("Save successful:", savedFile);
                } else {
                    throw new Error("Save operation did not return expected file information.");
                }
            } catch (error) {
                console.error("Failed to save data to Drive:", error);
                this.driveStatusMessage = `Save error: ${error.message || 'Unknown error'}`;
            }
        },
        async handleLoadFromDriveClick() {
            this.showLoadDropdown = false; // Close dropdown
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Error: Please sign in to load.";
                return;
            }
            this.driveStatusMessage = 'Opening Google Drive file picker...';
            this.googleDriveManager.showFilePicker(async (error, file) => {
                if (error) {
                    this.driveStatusMessage = `File selection error: ${error.message || 'Cancelled or failed.'}`;
                    console.warn("File selection error:", error);
                    return;
                }
                if (!file || !file.id) {
                    this.driveStatusMessage = 'File selection cancelled or no file chosen.';
                    return;
                }

                this.driveStatusMessage = `Loading ${file.name} from Drive...`;
                try {
                    const parsedData = await this.dataManager.loadDataFromDrive(file.id);
                    if (parsedData) {
                        this.character = parsedData.character;
                        this.skills = parsedData.skills;
                        this.specialSkills = parsedData.specialSkills;
                        this.equipments = parsedData.equipments;
                        this.histories = parsedData.histories;

                        this.currentDriveFileId = file.id;
                        this.currentDriveFileName = file.name;
                    this.driveStatusMessage = `Loaded: ${this.currentDriveFileName} from Drive.`;
                        console.log("Load successful:", file);
                    } else {
                        throw new Error("Load operation did not return data.");
                    }
                } catch (err) {
                    console.error("Failed to load data from Drive:", err);
                this.driveStatusMessage = `Load error for ${file.name || 'file'}: ${err.message || 'Unknown error'}`;
                }
        }, this.driveFolderId || null, ['application/json']); // MIME type for JSON files
        },

        // Image Management Methods
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
                this.currentImageIndex = this.character.images.length - 1; // Show the newly uploaded image
            } catch (error) {
                console.error("Error loading image:", error);
                this.showCustomAlert("画像の読み込みに失敗しました：" + error.message);
            } finally {
                event.target.value = null; // Clear the file input
            }
        },
        nextImage() {
            if (this.character && this.character.images && this.character.images.length > 0) {
                if (this.currentImageIndex < this.character.images.length - 1) {
                    this.currentImageIndex++;
                } else {
                    this.currentImageIndex = 0; // Loop back to the first image
                }
            }
        },
        previousImage() {
            if (this.character && this.character.images && this.character.images.length > 0) {
                if (this.currentImageIndex > 0) {
                    this.currentImageIndex--;
                } else {
                    this.currentImageIndex = this.character.images.length - 1; // Loop back to the last image
                }
            }
        },
        removeCurrentImage() {
            if (this.character && this.character.images && this.character.images.length > 0 && this.currentImageIndex >= 0 && this.currentImageIndex < this.character.images.length) {
                this.character.images.splice(this.currentImageIndex, 1);
                // Adjust currentImageIndex
                if (this.character.images.length === 0) {
                    this.currentImageIndex = -1;
                } else if (this.currentImageIndex >= this.character.images.length) {
                    // If the last image was removed, adjust index to the new last image
                    this.currentImageIndex = this.character.images.length - 1;
                }
                // If the currentImageIndex is still valid or adjusted to 0, it's fine.
            } else {
                console.warn("No image to remove or index out of bounds.");
            }
        }
    },
    mounted() {
        this.cocofoliaExporter = new window.CocofoliaExporter();
        this.dataManager = new window.DataManager(this.gameData);
        this.imageManagerInstance = window.ImageManager;

        // Bind outside click handlers
        this.boundCloseDriveMenuHandler = this.closeDriveMenuHandler.bind(this);
        this.boundCloseSaveDropdownHandler = this.closeSaveDropdownHandler.bind(this);
        this.boundCloseLoadDropdownHandler = this.closeLoadDropdownHandler.bind(this);

        window.vueApp = this; // Make Vue instance globally accessible

        // Initial Drive Status Message
        this.driveStatusMessage = "Initializing Google services...";

        if (window.GoogleDriveManager) {
            this.googleDriveManager = new window.GoogleDriveManager(this.apiKey, this.clientId);
            this.dataManager.setGoogleDriveManager(this.googleDriveManager);

            if (window.gapiScriptLoaded) {
                console.log("main.js mounted: GAPI script pre-loaded.");
                this.handleGapiLoaded();
            }
            if (window.gisScriptLoaded) {
                console.log("main.js mounted: GIS script pre-loaded.");
                this.handleGisLoaded();
            }
        } else {
            console.error("GoogleDriveManager class not found.");
            this.driveStatusMessage = "Error: Google Drive component failed to load.";
        }

        const savedFolderId = localStorage.getItem('aioniaDriveFolderId');
        const savedFolderName = localStorage.getItem('aioniaDriveFolderName');
        if (savedFolderId) {
            this.driveFolderId = savedFolderId;
            this.driveFolderName = savedFolderName || 'Previously Selected Folder';
            // Initial status message will be updated once APIs load and sign-in state is clearer
            if (!this.isGapiInitialized || !this.isGisInitialized) {
                 this.driveStatusMessage = `Folder "${this.driveFolderName}" loaded. Waiting for Google services...`;
            } else if (!this.isSignedIn) {
                this.driveStatusMessage = `Folder "${this.driveFolderName}" loaded. Please sign in.`;
            } else {
                 this.driveStatusMessage = `Signed in. Folder: ${this.driveFolderName}`;
            }
        } else {
            if (!this.isGapiInitialized || !this.isGisInitialized) {
                this.driveStatusMessage = "Waiting for Google services...";
            } else if (!this.isSignedIn) {
                this.driveStatusMessage = "Please sign in and choose a Drive folder.";
            } else {
                 this.driveStatusMessage = "Signed in. No Drive folder selected.";
            }
        }

        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});

app.mount('#app');