const { createApp } = Vue;

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
            helpState: 'closed', // 'closed', 'hovered', 'fixed'
            isDesktop: false,
            helpText: window.AioniaGameData.helpText,
            outputButtonText: window.AioniaGameData.uiMessages.outputButton.default,
            cocofoliaExporter: null,
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
        isHelpVisible() {
            return this.helpState !== 'closed';
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
        // --- Help Panel Methods ---
        handleHelpIconMouseOver() {
            if (this.isDesktop) {
                if (this.helpState === 'closed') {
                    this.helpState = 'hovered';
                }
            }
        },
        handleHelpIconMouseLeave() {
            if (this.isDesktop) {
                if (this.helpState === 'hovered') {
                    this.helpState = 'closed';
                }
            }
        },
        handleHelpIconClick() {
            if (this.isDesktop) {
                this.helpState = this.helpState === 'fixed' ? 'closed' : 'fixed';
            } else { // Mobile toggle behavior
                this.helpState = this.helpState === 'closed' ? 'fixed' : 'closed';
            }
        },
        closeHelpPanel() {
            this.helpState = 'closed';
        },
        handleClickOutside(event) {
            if (this.helpState === 'fixed') {
                const helpPanelElement = this.$refs.helpPanel; // Use $refs to get the help panel element
                const helpIconElement = this.$refs.helpIcon;   // Use $refs to get the help icon element

                // Check if both elements are available
                if (helpPanelElement && helpIconElement) {
                    // Check if the click target is outside both the help panel and the help icon
                    if (!helpPanelElement.contains(event.target) && !helpIconElement.contains(event.target)) {
                        this.helpState = 'closed';
                    }
                } else if (helpPanelElement && !helpPanelElement.contains(event.target)) {
                    // Fallback if helpIconElement is not found, but helpPanelElement is.
                    // This might happen if the icon isn't part of the click path consideration for closing.
                    this.helpState = 'closed';
                } else if (!helpPanelElement && helpIconElement && !helpIconElement.contains(event.target)) {
                    // Fallback if helpPanelElement is not (e.g. v-if removed it),
                    // but click is outside helpIcon. This logic might need refinement
                    // depending on exact desired behavior when panel is not visible but state is 'fixed'.
                    // For now, this ensures clicking outside icon (if panel somehow not rendered) still closes.
                    this.helpState = 'closed';
                }
            }
        },
        // --- Other Methods ---
        _manageListItem({ list, action, index, newItemFactory, hasContentChecker, maxLength }) {
            if (action === 'add') {
                if (maxLength && list.length >= maxLength) {
                    return; // Do nothing if max length reached
                }
                const newItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
                list.push(typeof newItem === 'object' && newItem !== null ? window.deepClone(newItem) : newItem);
            } else if (action === 'remove') {
                if (list.length > 1) {
                    list.splice(index, 1);
                } else if (list.length === 1 && hasContentChecker && hasContentChecker(list[index])) {
                    const emptyItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
                    list[index] = typeof emptyItem === 'object' && emptyItem !== null ? window.deepClone(emptyItem) : emptyItem;
                }
            }
        },
        hasSpecialSkillContent(ss) { return !!(ss.group || ss.name || ss.note); },
        hasHistoryContent(h) { return !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo); },

        addSpecialSkillItem() {
            this._manageListItem({
                list: this.specialSkills,
                action: 'add',
                newItemFactory: () => ({ group: '', name: '', note: '', showNote: false }),
                maxLength: this.gameData.config.maxSpecialSkills
            });
        },
        removeSpecialSkill(index) {
            this._manageListItem({
                list: this.specialSkills,
                action: 'remove',
                index: index,
                newItemFactory: () => ({ group: '', name: '', note: '', showNote: false }),
                hasContentChecker: this.hasSpecialSkillContent
            });
        },
        expertPlaceholder(skill) {
            return skill.checked ? this.gameData.placeholderTexts.expertSkill : this.gameData.placeholderTexts.expertSkillDisabled;
        },
        handleSpeciesChange() {
            if (this.character.species !== 'other') {
                this.character.rareSpecies = '';
            }
        },
        addExpert(skill) {
            if (skill.canHaveExperts) {
                this._manageListItem({
                    list: skill.experts,
                    action: 'add',
                    newItemFactory: () => ({ value: '' })
                });
            }
        },
        removeExpert(skill, expertIndex) {
            this._manageListItem({
                list: skill.experts,
                action: 'remove',
                index: expertIndex,
                newItemFactory: () => ({ value: '' }),
                hasContentChecker: (expert) => expert.value && expert.value.trim() !== ''
            });
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
        addHistoryItem() {
            this._manageListItem({
                list: this.histories,
                action: 'add',
                newItemFactory: () => ({ sessionName: '', gotExperiments: null, memo: '' })
            });
        },
        removeHistoryItem(index) {
            this._manageListItem({
                list: this.histories,
                action: 'remove',
                index: index,
                newItemFactory: () => ({ sessionName: '', gotExperiments: null, memo: '' }),
                hasContentChecker: this.hasHistoryContent
            });
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
                this.playOutputAnimation();
            } catch (err) {
                console.error('Failed to copy: ', err);
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
                const successful = document.execCommand('copy');
                if (successful) {
                    this.playOutputAnimation();
                } else {
                    this.outputButtonText = this.gameData.uiMessages.outputButton.failed;
                    setTimeout(() => {
                        this.outputButtonText = this.gameData.uiMessages.outputButton.default;
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
            if (!button || button.classList.contains('is-animating')) {
                return;
            }

            // gameDataからアニメーション設定を取得
            const buttonMessages = this.gameData.uiMessages.outputButton;
            const timings = buttonMessages.animationTimings;
            const originalText = buttonMessages.default;
            const newText = buttonMessages.animating;

            button.classList.add('is-animating');

            // 各ステップの時間を定義
            const state1_duration = timings.state1_bgFill;
            const state2_duration = timings.state2_textHold;
            const state3_duration = timings.state3_textFadeOut;
            const state4_duration = timings.state4_bgReset;

            // setTimeoutで使うための累積時間を計算
            const timeForState2 = state1_duration;
            const timeForState3 = timeForState2 + state2_duration;
            const timeForState4 = timeForState3 + state3_duration;
            const timeForCleanup = timeForState4 + state4_duration;

            // --- Animation Step 1 ---
            button.classList.add('state-1');

            // --- Animation Step 2 ---
            setTimeout(() => {
                button.classList.remove('state-1');
                this.outputButtonText = newText;
                button.classList.add('state-2');
            }, timeForState2);

            // --- Animation Step 3 ---
            setTimeout(() => {
                button.classList.remove('state-2');
                button.classList.add('state-3');
            }, timeForState3);

            // --- Animation Step 4 ---
            setTimeout(() => {
                button.classList.remove('state-3');
                this.outputButtonText = originalText;
                button.classList.add('state-4');
            }, timeForState4);

            // --- Final Cleanup ---
            setTimeout(() => {
                button.classList.remove('is-animating', 'state-4');
            }, timeForCleanup);
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
        this.imageManagerInstance = window.ImageManager; // Initialize ImageManager

        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }

        // Detect if it's a desktop device (no touch support)
        this.isDesktop = !('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0));

        // Add event listener for both desktop and mobile to handle outside clicks for 'fixed' state
        // Ensure the listener is added after the initial DOM render is complete for $refs to be available.
        this.$nextTick(() => {
            document.addEventListener('click', this.handleClickOutside);
        });
    },
    beforeUnmount() {
        // Clean up event listener when the component is unmounted
        document.removeEventListener('click', this.handleClickOutside);
    }
});

app.mount('#app');
