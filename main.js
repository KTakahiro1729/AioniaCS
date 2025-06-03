const { createApp, watch, nextTick } = Vue;

const app = createApp({
    data() {
        return {
            // gameData.jsへの参照を追加
            gameData: window.AioniaGameData,

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
            return this.currentExperiencePoints > this.maxExperimentPoints ? 'experience-over' : 'experience-ok';
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
            const dataToSave = {
                character: this.character,
                skills: this.skills.map(s => ({
                    id: s.id, checked: s.checked, canHaveExperts: s.canHaveExperts,
                    experts: s.canHaveExperts ? s.experts.filter(e => e.value && e.value.trim() !== '').map(e => ({ value: e.value })) : []
                })),
                specialSkills: this.specialSkills.filter(ss => ss.group && ss.name),
                equipments: this.equipments,
                histories: this.histories.filter(h => h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo)
            };
            const jsonData = JSON.stringify(dataToSave, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const filename = this.character.name || 'Aionia_Character';
            a.download = `${filename}_AioniaSheet.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target.result;
                    try {
                        const rawJsonData = JSON.parse(fileContent);
                        this.parseLoadedData(rawJsonData);
                    } catch (error) {
                        console.error("Failed to parse JSON file:", error);
                        this.showCustomAlert(this.gameData.uiMessages.fileLoadError);
                    }
                };
                reader.readAsText(file);
            }
            event.target.value = null;
        },
        convertExternalJsonToInternalFormat(externalData) {
            const internalData = {
                character: {
                    name: externalData.name || '',
                    playerName: externalData.player || '',
                    species: externalData.species || '',
                    rareSpecies: externalData.rare_species || '',
                    occupation: externalData.occupation || '',
                    age: externalData.age ? parseInt(externalData.age) : null,
                    gender: externalData.gender || '',
                    height: externalData.height || '',
                    weight: externalData.weight || '',
                    origin: externalData.origin || '',
                    faith: externalData.faith || '',
                    otherItems: externalData.otherItems || '',
                    initialScar: externalData.init_scar ? parseInt(externalData.init_scar) : 0,
                    currentScar: externalData.init_scar ? parseInt(externalData.init_scar) : 0,
                    linkCurrentToInitialScar: typeof externalData.linkCurrentToInitialScar === 'boolean' ? externalData.linkCurrentToInitialScar : true,
                    memo: externalData.character_memo || '',
                    weaknesses: Array(this.gameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }))
                },
                skills: [], specialSkills: [],
                equipments: { weapon1: { group: '', name: '' }, weapon2: { group: '', name: '' }, armor: { group: '', name: '' } },
                histories: []
            };

            if (externalData.init_weakness1) {
                internalData.character.weaknesses[0] = { text: externalData.init_weakness1, acquired: '作成時' };
            }
            if (externalData.init_weakness2) {
                internalData.character.weaknesses[1] = { text: externalData.init_weakness2, acquired: '作成時' };
            }

            if (externalData.skills && Array.isArray(externalData.skills)) {
                this.externalSkillOrder.forEach((skillId, index) => {
                    const appSkillDefinition = this.gameData.baseSkills.find(s => s.id === skillId);
                    if (appSkillDefinition && externalData.skills[index]) {
                        const externalSkill = externalData.skills[index];
                        const newSkill = {
                            id: appSkillDefinition.id, name: appSkillDefinition.name,
                            checked: !!externalSkill.selected, canHaveExperts: appSkillDefinition.canHaveExperts,
                            experts: []
                        };
                        if (newSkill.checked && newSkill.canHaveExperts) {
                            if (externalSkill.expert_skills && externalSkill.expert_skills.length > 0) {
                                newSkill.experts = externalSkill.expert_skills.map(es => ({ value: es || '' })).filter(e => e.value);
                            }
                            if (newSkill.experts.length === 0) newSkill.experts.push({ value: '' });
                        } else if (newSkill.canHaveExperts) {
                            newSkill.experts.push({ value: '' });
                        }
                        internalData.skills.push(newSkill);
                    } else if (appSkillDefinition) {
                        internalData.skills.push(JSON.parse(JSON.stringify(appSkillDefinition)));
                    }
                });
            } else {
                internalData.skills = JSON.parse(JSON.stringify(this.gameData.baseSkills));
            }

            if (externalData.special_skills && Array.isArray(externalData.special_skills)) {
                internalData.specialSkills = externalData.special_skills
                    .filter(ss => ss.group && ss.name)
                    .map(ss => ({
                        group: ss.group || '', name: ss.name || '',
                        note: ss.note || '', showNote: this.gameData.specialSkillsRequiringNote.includes(ss.name || '')
                    }));
            }

            if (externalData.weapon1_type || externalData.weapon1_name) {
                internalData.equipments.weapon1 = { group: externalData.weapon1_type || '', name: externalData.weapon1_name || '' };
            }
            if (externalData.weapon2_type || externalData.weapon2_name) {
                internalData.equipments.weapon2 = { group: externalData.weapon2_type || '', name: externalData.weapon2_name || '' };
            }
            if (externalData.armor_type || externalData.armor_name) {
                internalData.equipments.armor = { group: externalData.armor_type || '', name: externalData.armor_name || '' };
            }

            if (externalData.history && Array.isArray(externalData.history)) {
                internalData.histories = externalData.history.map(h => ({
                    sessionName: h.name || '',
                    gotExperiments: h.experiments ? parseInt(h.experiments) : null,
                    memo: h.stress || h.memo || ''
                }));
            }
            return internalData;
        },

        parseLoadedData(rawJsonData) {
            let dataToParse = rawJsonData;
            if (rawJsonData && typeof rawJsonData.player !== 'undefined' && typeof rawJsonData.character_memo !== 'undefined') {
                console.log("External JSON format (bright-trpg tool) detected, converting...");
                dataToParse = this.convertExternalJsonToInternalFormat(rawJsonData);
            } else if (rawJsonData && rawJsonData.character && typeof rawJsonData.character.playerName !== 'undefined') {
                console.log("Internal JSON format (this tool) detected.");
            } else {
                console.warn("Unknown JSON format, attempting to parse as is. Data integrity not guaranteed.");
                dataToParse = {
                    character: {}, skills: [], specialSkills: [], equipments: {}, histories: [],
                    ...rawJsonData
                };
            }

            const defaultCharacter = {
                ...this.gameData.defaultCharacterData,
                weaknesses: Array(this.gameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }))
            };
            this.character = { ...defaultCharacter, ...(dataToParse.character || {}) };
            if (typeof this.character.linkCurrentToInitialScar === 'undefined') {
                this.character.linkCurrentToInitialScar = true;
            }

            if (this.character.weaknesses && Array.isArray(this.character.weaknesses)) {
                const numMissingWeaknesses = this.gameData.config.maxWeaknesses - this.character.weaknesses.length;
                if (numMissingWeaknesses > 0) {
                    for (let i = 0; i < numMissingWeaknesses; i++) {
                        this.character.weaknesses.push({ text: '', acquired: '--' });
                    }
                } else if (this.character.weaknesses.length > this.gameData.config.maxWeaknesses) {
                    this.character.weaknesses = this.character.weaknesses.slice(0, this.gameData.config.maxWeaknesses);
                }
            } else {
                this.character.weaknesses = Array(this.gameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }));
            }

            const baseSkills = JSON.parse(JSON.stringify(this.gameData.baseSkills));
            if (dataToParse.skills && Array.isArray(dataToParse.skills)) {
                const loadedSkillsById = new Map(dataToParse.skills.map(s => [s.id, s]));
                this.skills = baseSkills.map(appSkill => {
                    const loadedSkillData = loadedSkillsById.get(appSkill.id);
                    if (loadedSkillData) {
                        appSkill.checked = !!loadedSkillData.checked;
                        if (appSkill.canHaveExperts) {
                            if (loadedSkillData.experts && loadedSkillData.experts.length > 0) {
                                appSkill.experts = loadedSkillData.experts.map(e => ({ value: e.value || '' }));
                                if (appSkill.experts.every(e => e.value === '')) {
                                    appSkill.experts = [{ value: '' }];
                                }
                            } else {
                                appSkill.experts = [{ value: '' }];
                            }
                        } else {
                            appSkill.experts = [];
                        }
                    }
                    return appSkill;
                });
            } else {
                this.skills = baseSkills;
            }

            let loadedSSCount = 0;
            if (dataToParse.specialSkills && Array.isArray(dataToParse.specialSkills)) {
                loadedSSCount = dataToParse.specialSkills.length;
            }
            const targetSpecialSkillsLength = Math.min(Math.max(this.initialSpecialSkillCount, loadedSSCount), this.gameData.config.maxSpecialSkills);
            this.specialSkills = [];

            for (let i = 0; i < targetSpecialSkillsLength; i++) {
                if (dataToParse.specialSkills && i < dataToParse.specialSkills.length) {
                    const loadedSS = dataToParse.specialSkills[i];
                    this.specialSkills.push({
                        group: loadedSS.group || '',
                        name: loadedSS.name || '',
                        note: loadedSS.note || '',
                        showNote: this.gameData.specialSkillsRequiringNote.includes(loadedSS.name || '')
                    });
                } else {
                    this.specialSkills.push({ group: '', name: '', note: '', showNote: false });
                }
            }

            if (dataToParse.equipments) {
                this.equipments.weapon1 = { group: '', name: '', ...(dataToParse.equipments.weapon1 || {}) };
                this.equipments.weapon2 = { group: '', name: '', ...(dataToParse.equipments.weapon2 || {}) };
                this.equipments.armor = { group: '', name: '', ...(dataToParse.equipments.armor || {}) };
            } else {
                this.equipments = { weapon1: { group: '', name: '' }, weapon2: { group: '', name: '' }, armor: { group: '', name: '' } };
            }

            if (dataToParse.histories && dataToParse.histories.length > 0) {
                this.histories = dataToParse.histories.map(h => ({
                    sessionName: h.sessionName || '',
                    gotExperiments: (h.gotExperiments === null || h.gotExperiments === undefined || h.gotExperiments === '') ? null : Number(h.gotExperiments),
                    memo: h.memo || ''
                }));
            } else {
                this.histories = [{ sessionName: '', gotExperiments: null, memo: '' }];
            }
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
                modal.style.position = 'fixed';
                modal.style.left = '50%';
                modal.style.top = '50%';
                modal.style.transform = 'translate(-50%, -50%)';
                modal.style.backgroundColor = '#333';
                modal.style.color = '#fff';
                modal.style.padding = '20px';
                modal.style.border = '1px solid #555';
                modal.style.borderRadius = '5px';
                modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
                modal.style.zIndex = '2000';
                modal.style.whiteSpace = 'pre-wrap';

                const messageP = document.createElement('p');
                messageP.style.margin = '0 0 15px 0';
                modal.appendChild(messageP);

                const closeButton = document.createElement('button');
                closeButton.textContent = 'OK';
                closeButton.style.padding = '8px 15px';
                closeButton.style.backgroundColor = '#c09a69';
                closeButton.style.color = '#1a1a1a';
                closeButton.style.border = 'none';
                closeButton.style.borderRadius = '3px';
                closeButton.style.cursor = 'pointer';
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

        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});

app.mount('#app');