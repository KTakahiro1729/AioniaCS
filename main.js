const { createApp, watch, nextTick } = Vue;

const app = createApp({
    data() {
        return {
            // gameData.jsへの参照を追加
            gameData: window.AioniaGameData,
            dataManager: null,
            character: {
                name: '', playerName: '', species: '', rareSpecies: '',
                occupation: '', age: null, gender: '', height: '', weight: '',
                origin: '', faith: '',
                otherItems: '',
                currentScar: 0,
                initialScar: 0,
                linkCurrentToInitialScar: true,
                memo: '',
                weaknesses: Array(window.AioniaGameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' })),
            },
            skills: JSON.parse(JSON.stringify(window.AioniaGameData.baseSkills)),
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
        };
    },
    computed: {
        maxExperimentPoints() {
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
            return this.currentExperiencePoints > this.maxExperimentPoints ? 'status-display--experience-over' : 'status-display--experience-ok';
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

        setOutputButtonSuccess() {
            this.outputButtonText = this.gameData.uiMessages.outputButton.success;
            setTimeout(() => {
                this.outputButtonText = this.gameData.uiMessages.outputButton.default;
            }, 3000);
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
                    this.outputButtonText = this.gameData.uiMessages.outputButton.successFallback;
                    setTimeout(() => {
                        this.outputButtonText = this.gameData.uiMessages.outputButton.default;
                    }, 3000);
                } else {
                    this.outputButtonText = this.gameData.uiMessages.outputButton.failed;
                    setTimeout(() => {
                        this.outputButtonText = this.gameData.uiMessages.outputButton.default;
                    }, 3000);
                }
            } catch (err) {
                this.outputButtonText = this.gameData.uiMessages.outputButton.error;
                setTimeout(() => {
                    this.outputButtonText = this.gameData.uiMessages.outputButton.default;
                }, 3000);
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
        }
    },
    mounted() {
        this.cocofoliaExporter = new window.CocofoliaExporter();
        this.dataManager = new window.DataManager(this.gameData);

        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});

app.component('equipment-item', {
    props: {
        label: String,
        modelGroup: String,
        modelName: String,
        options: Array,
        placeholder: String
    },
    emits: ['update:modelGroup', 'update:modelName'],
    template: `
        <div class="equipment-item">
            <label>{{ label }}</label>
            <div class="flex-group">
                <select class="flex-item-1" :value="modelGroup" @input="$emit('update:modelGroup', $event.target.value)">
                    <option v-for="option in options" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>
                <input type="text" class="flex-item-2" :value="modelName" :placeholder="placeholder"
                    @input="$emit('update:modelName', $event.target.value)" />
            </div>
        </div>
    `
});

app.mount('#app');