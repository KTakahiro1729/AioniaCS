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
            apiKey: 'AIzaSyD481puTNfH73S2yJtepddwJheGy7rEc9U',
            clientId: '913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com',
            isGapiInitialized: false, // To prevent multiple GAPI initializations
            isGisInitialized: false,  // To prevent multiple GIS initializations
        };
    },
    computed: {
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
        }
    },
    watch: {
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
        saveData() {
            this.dataManager.saveData(
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
        handleGapiLoaded() {
            if (this.isGapiInitialized || !this.googleDriveManager) return;
            this.isGapiInitialized = true;

            this.isGapiLoaded = true; // Still useful for UI, indicates script is loaded
            this.driveStatusMessage = 'Initializing Google API Client...';
            console.log("Vue app: handleGapiLoaded triggered.");
            try {
                await this.googleDriveManager.onGapiLoad();
                this.driveStatusMessage = 'Google API client initialized.';
                console.log('Google API client initialized successfully in Vue.');
            } catch (err) {
                this.driveStatusMessage = 'Failed to initialize Google API client (Vue).';
                console.error('GAPI client init error in Vue app:', err);
            }
        },
        async handleGisLoaded() {
            if (this.isGisInitialized || !this.googleDriveManager) return;
            this.isGisInitialized = true;

            this.isGisLoaded = true; // Still useful for UI
            this.driveStatusMessage = 'Initializing Google Sign-In...';
            console.log("Vue app: handleGisLoaded triggered.");
            try {
                await this.googleDriveManager.onGisLoad();
                this.driveStatusMessage = 'Google Sign-In initialized.';
                console.log('Google Sign-In initialized successfully in Vue.');
            } catch (err) {
                this.driveStatusMessage = 'Failed to initialize Google Sign-In (Vue).';
                console.error('GIS client init error in Vue app:', err);
            }
        },
        async handleSignInClick() {
            if (!this.googleDriveManager) {
                this.driveStatusMessage = "Google Drive Manager not ready.";
                return;
            }
            this.driveStatusMessage = 'Signing in...';
            try {
                // Wrap callback-based signIn in a Promise-like structure if needed, or handle directly
                this.googleDriveManager.handleSignIn((error, authResult) => {
                    if (error || !authResult || !authResult.signedIn) {
                        this.isSignedIn = false;
                        this.googleUser = null;
                        this.driveStatusMessage = 'Sign-in failed: ' + (error ? error.message : 'Please try again or ensure pop-ups are enabled.');
                        console.error("Sign-in error or not signed in:", error, authResult);
                    } else {
                        this.isSignedIn = true;
                        // Note: GIS token client doesn't directly provide user profile info like gapi.auth2.
                        // We'll rely on gapi.client calls being authorized.
                        // If basic profile info is needed, it would require an additional call to People API or similar.
                        // For now, just acknowledge sign-in.
                        this.googleUser = { displayName: 'Signed In User' }; // Placeholder
                        this.driveStatusMessage = 'Successfully signed in.';
                        console.log("Sign-in successful.");

                        if (!this.driveFolderId) {
                             this.getOrPromptForDriveFolder(); // Intentionally not awaiting here for now
                        }
                    }
                });
            } catch (err) { // This catch might not be effective for callback errors
                this.isSignedIn = false;
                this.googleUser = null;
                this.driveStatusMessage = 'Sign-in error: ' + err.message;
                console.error("Exception during signIn:", err);
            }
        },
        handleSignOutClick() {
            if (!this.googleDriveManager) {
                this.driveStatusMessage = "Google Drive Manager not ready.";
                return;
            }
            this.driveStatusMessage = 'Signing out...';
            this.googleDriveManager.handleSignOut(() => {
                this.isSignedIn = false;
                this.googleUser = null;
                this.currentDriveFileId = null;
                this.currentDriveFileName = '';
                // this.driveFolderId = null; // Optionally clear folder preference on sign-out
                // this.driveFolderName = '';
                this.driveStatusMessage = 'Successfully signed out.';
                console.log("Sign-out complete.");
            });
        },
        async getOrPromptForDriveFolder() {
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Please sign in first.";
                return;
            }
            this.driveStatusMessage = 'Setting up Drive folder...';
            const appFolderName = 'AioniaCS_Data'; // Default app folder name

            try {
                const folderInfo = await this.googleDriveManager.getOrCreateAppFolder(appFolderName);
                if (folderInfo && folderInfo.id) {
                    this.driveFolderId = folderInfo.id;
                    this.driveFolderName = folderInfo.name; // This will be appFolderName
                    localStorage.setItem('aioniaDriveFolderId', folderInfo.id);
                    localStorage.setItem('aioniaDriveFolderName', folderInfo.name);
                    this.driveStatusMessage = `Using Drive folder: ${folderInfo.name}. You can change this with "Choose Drive Folder".`;
                } else {
                    this.driveStatusMessage = 'Could not auto-setup Drive folder. Please choose one manually.';
                    // Fallback to manual prompt if getOrCreateAppFolder failed or returned nothing.
                    await this.promptForDriveFolder();
                }
            } catch (error) {
                console.error("Error in getOrPromptForDriveFolder:", error);
                this.driveStatusMessage = `Error setting up folder: ${error.message}. Please choose manually.`;
                await this.promptForDriveFolder(); // Fallback if there was an error
            }
        },
        async promptForDriveFolder() {
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Please sign in first to choose a folder.";
                return;
            }
            this.driveStatusMessage = 'Waiting for folder selection...';
            this.googleDriveManager.showFolderPicker((error, folder) => {
                if (error) {
                    this.driveStatusMessage = `Folder selection failed: ${error.message}`;
                    console.warn("Folder selection error:", error);
                } else if (folder && folder.id) {
                    this.driveFolderId = folder.id;
                    this.driveFolderName = folder.name;
                    localStorage.setItem('aioniaDriveFolderId', folder.id);
                    localStorage.setItem('aioniaDriveFolderName', folder.name);
                    this.driveStatusMessage = `Selected Drive folder: ${folder.name}`;
                    this.currentDriveFileId = null; // Reset file context if folder changes
                    this.currentDriveFileName = '';
                    console.log("Folder selected:", folder);
                } else {
                    // This case might occur if picker is closed without error but no folder.
                    this.driveStatusMessage = 'Folder selection cancelled or no folder chosen.';
                }
            });
        },
        async handleSaveToDriveClick() {
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Please sign in to save to Drive.";
                return;
            }
            if (!this.driveFolderId) {
                this.driveStatusMessage = "Target Drive folder not set. Prompting for folder selection...";
                await this.promptForDriveFolder(); // Prompt and wait
                if (!this.driveFolderId) { // Check again if folder was selected
                    this.driveStatusMessage = "Cannot save: No Drive folder selected.";
                    return;
                }
            }

            this.driveStatusMessage = `Saving to ${this.driveFolderName}...`;
            const fileName = (this.character.name || 'Aionia_Character_Sheet').replace(/[\\/:*?"<>|]/g, '_') + '.json';

            try {
                const savedFile = await this.dataManager.saveDataToDrive(
                    this.character, this.skills, this.specialSkills, this.equipments, this.histories,
                    this.driveFolderId, this.currentDriveFileId, fileName
                );
                if (savedFile && savedFile.id) {
                    this.currentDriveFileId = savedFile.id;
                    this.currentDriveFileName = savedFile.name;
                    this.driveStatusMessage = `Data saved to ${savedFile.name} in ${this.driveFolderName}.`;
                    console.log("Save successful:", savedFile);
                } else {
                    throw new Error("Save operation did not return expected file information.");
                }
            } catch (error) {
                console.error("Failed to save data to Drive:", error);
                this.driveStatusMessage = `Failed to save: ${error.message || 'Unknown error'}`;
            }
        },
        async handleLoadFromDriveClick() {
            if (!this.isSignedIn || !this.googleDriveManager) {
                this.driveStatusMessage = "Please sign in to load from Drive.";
                return;
            }
            this.driveStatusMessage = 'Waiting for file selection...';
            // Pass current driveFolderId to picker if available, otherwise null (root).
            this.googleDriveManager.showFilePicker(async (error, file) => {
                if (error) {
                    this.driveStatusMessage = `File selection failed: ${error.message}`;
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
                        this.driveStatusMessage = `Loaded ${file.name} from Drive.`;
                        console.log("Load successful:", file);
                        // If the loaded file is from a different folder than currently set,
                        // it's a choice whether to update driveFolderId. For now, we don't.
                    } else {
                         throw new Error("Load operation did not return data.");
                    }
                } catch (err) {
                    console.error("Failed to load data from Drive:", err);
                    this.driveStatusMessage = `Failed to load ${file.name}: ${err.message || 'Unknown error'}`;
                }
            }, this.driveFolderId || null, ['application/json']);
        }
    },
    mounted() {
        this.cocofoliaExporter = new window.CocofoliaExporter();
        this.dataManager = new window.DataManager(this.gameData);

        // Make Vue instance globally accessible for the script loader callbacks
        window.vueApp = this;

        // Initialize GoogleDriveManager
        if (window.GoogleDriveManager) {
            this.googleDriveManager = new window.GoogleDriveManager(this.apiKey, this.clientId);
            this.dataManager.setGoogleDriveManager(this.googleDriveManager);

            // Check global flags set by placeholder functions in index.html
            if (window.gapiScriptLoaded) {
                console.log("main.js mounted: GAPI script was already loaded by placeholder, calling handler.");
                this.handleGapiLoaded();
            }
            // else the placeholder vueGapiLoadedPlaceholder in index.html will call it when gapi script loads.

            if (window.gisScriptLoaded) {
                console.log("main.js mounted: GIS script was already loaded by placeholder, calling handler.");
                this.handleGisLoaded();
            }
            // else the placeholder vueGisLoadedPlaceholder in index.html will call it when gis script loads.

        } else {
            console.error("GoogleDriveManager class not found. Ensure googleDriveManager.js is loaded.");
            this.driveStatusMessage = "Error: Google Drive component failed to load.";
        }

        // Load Drive preferences
        const savedFolderId = localStorage.getItem('aioniaDriveFolderId');
        const savedFolderName = localStorage.getItem('aioniaDriveFolderName');
        if (savedFolderId) {
            this.driveFolderId = savedFolderId;
            this.driveFolderName = savedFolderName || 'Previously Selected Folder';
            // Potentially update UI or status message
        }


        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});

app.mount('#app');
