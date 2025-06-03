const { createApp, watch, nextTick } = Vue;

const app = createApp({
    data() {
        return {
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
            outputButtonText: 'ココフォリア駒出力',
            specialSkillData: window.AioniaGameData.specialSkillData,
            specialSkillsRequiringNote: window.AioniaGameData.specialSkillsRequiringNote,
            speciesLabelMap: window.AioniaGameData.speciesLabelMap,
            equipmentGroupLabelMap: window.AioniaGameData.equipmentGroupLabelMap,
            weaponDamage: window.AioniaGameData.weaponDamage,
        };
    },
    computed: {
        maxExperimentPoints() {
            const initialScarExp = Number(this.character.initialScar) || 0;
            const creationWeaknessExp = this.character.weaknesses.reduce((sum, weakness) => {
                return sum + (weakness.text && weakness.text.trim() !== '' && weakness.acquired === '作成時' ? 10 : 0);
            }, 0);
            const combinedInitialBonus = Math.min(initialScarExp + creationWeaknessExp, 20);
            const historyExp = this.histories.reduce((sum, h) => sum + (Number(h.gotExperiments) || 0), 0);
            return 100 + combinedInitialBonus + historyExp;
        },
        currentExperiencePoints() {
            let skillExp = this.skills.reduce((sum, s) => sum + (s.checked ? 10 : 0), 0);
            let expertExp = this.skills.reduce((sum, s) => {
                if (s.checked && s.canHaveExperts) {
                    return sum + s.experts.reduce((expSum, exp) => expSum + (exp.value && exp.value.trim() !== '' ? 5 : 0), 0);
                }
                return sum;
            }, 0);
            let specialSkillExp = this.specialSkills.reduce((sum, ss) => sum + (ss.name && ss.name.trim() !== '' ? 5 : 0), 0);
            return skillExp + expertExp + specialSkillExp;
        },
        currentWeight() {
            const weaponWeights = { "": 0, "combat_small": 1, "combat_medium": 3, "combat_large": 5, "shooting": 2, "catalyst": 1 };
            const armorWeights = { "": 0, "light_armor": 2, "heavy_armor": 5 };
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
            const defaultOptions = [
                { value: '--', text: '--', disabled: false },
                { value: '作成時', text: '作成時', disabled: false }
            ];
            const sessionOptions = this.histories
                .map(h => h.sessionName)
                .filter(name => name && name.trim() !== '')
                .map(name => ({ value: name, text: name, disabled: false }));
            const helpOption = { value: 'help-text', text: '（冒険の記録を追加すると選択肢が増えます）', disabled: true };
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
            if (this.specialSkills.length < window.AioniaGameData.config.maxSpecialSkills) {
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
        expertPlaceholder(skill) { return skill.checked ? "専門技能" : "専門技能 (技能選択で有効)"; },
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
                return this.specialSkillData[group] || [];
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
                this.specialSkills[index].showNote = this.specialSkillsRequiringNote.includes(skillName);
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
                        this.showCustomAlert("ファイルの読み込みに失敗しました。JSON形式が正しくない可能性があります。");
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
                    weaknesses: Array(window.AioniaGameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }))
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
                    const appSkillDefinition = window.AioniaGameData.baseSkills.find(s => s.id === skillId);
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
                internalData.skills = JSON.parse(JSON.stringify(window.AioniaGameData.baseSkills));
            }

            if (externalData.special_skills && Array.isArray(externalData.special_skills)) {
                internalData.specialSkills = externalData.special_skills
                    .filter(ss => ss.group && ss.name)
                    .map(ss => ({
                        group: ss.group || '', name: ss.name || '',
                        note: ss.note || '', showNote: this.specialSkillsRequiringNote.includes(ss.name || '')
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
                name: '', playerName: '', species: '', rareSpecies: '',
                occupation: '', age: null, gender: '', height: '', weight: '',
                origin: '', faith: '',
                otherItems: '',
                currentScar: 0, initialScar: 0, linkCurrentToInitialScar: true, memo: '',
                weaknesses: Array(window.AioniaGameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }))
            };
            this.character = { ...defaultCharacter, ...(dataToParse.character || {}) };
            if (typeof this.character.linkCurrentToInitialScar === 'undefined') {
                this.character.linkCurrentToInitialScar = true;
            }

            if (this.character.weaknesses && Array.isArray(this.character.weaknesses)) {
                const numMissingWeaknesses = window.AioniaGameData.config.maxWeaknesses - this.character.weaknesses.length;
                if (numMissingWeaknesses > 0) {
                    for (let i = 0; i < numMissingWeaknesses; i++) {
                        this.character.weaknesses.push({ text: '', acquired: '--' });
                    }
                } else if (this.character.weaknesses.length > window.AioniaGameData.config.maxWeaknesses) {
                    this.character.weaknesses = this.character.weaknesses.slice(0, window.AioniaGameData.config.maxWeaknesses);
                }
            } else {
                this.character.weaknesses = Array(window.AioniaGameData.config.maxWeaknesses).fill(null).map(() => ({ text: '', acquired: '--' }));
            }

            const baseSkills = JSON.parse(JSON.stringify(window.AioniaGameData.baseSkills));
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
            const targetSpecialSkillsLength = Math.min(Math.max(this.initialSpecialSkillCount, loadedSSCount), window.AioniaGameData.config.maxSpecialSkills);
            this.specialSkills = [];

            for (let i = 0; i < targetSpecialSkillsLength; i++) {
                if (dataToParse.specialSkills && i < dataToParse.specialSkills.length) {
                    const loadedSS = dataToParse.specialSkills[i];
                    this.specialSkills.push({
                        group: loadedSS.group || '',
                        name: loadedSS.name || '',
                        note: loadedSS.note || '',
                        showNote: this.specialSkillsRequiringNote.includes(loadedSS.name || '')
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
            const scar = Number(this.character.currentScar) || 0;
            const stress = 0;

            let memoLines = [];
            memoLines.push(`名前：${this.character.name || '名無し'}${this.character.playerName ? `（${this.character.playerName}）` : ""}`);

            const speciesText = this.speciesLabelMap[this.character.species] || this.character.species;
            memoLines.push(`種族：${this.character.species === 'other' ? `${speciesText}（${this.character.rareSpecies || '未設定'}）` : speciesText}`);
            if (this.character.gender) memoLines.push(`性別：${this.character.gender}`);
            if (this.character.age !== null) memoLines.push(`年齢：${this.character.age}`);
            if (this.character.origin) memoLines.push(`出身地：${this.character.origin}`);
            if (this.character.occupation) memoLines.push(`職業：${this.character.occupation}`);
            if (this.character.faith) memoLines.push(`信仰：${this.character.faith}`);
            if (this.character.height) memoLines.push(`身長：${this.character.height}`);
            if (this.character.weight) memoLines.push(`体重：${this.character.weight}`);

            let cocofoliaWeaknesses = [];
            this.character.weaknesses.forEach(w => {
                if (w.text && w.text.trim() !== '') {
                    let acquiredText = '';
                    if (w.acquired && w.acquired !== '--' && w.acquired !== 'help-text') {
                        acquiredText = ` (${w.acquired})`;
                    }
                    cocofoliaWeaknesses.push(`${w.text}${acquiredText}`);
                }
            });
            if (cocofoliaWeaknesses.length > 0) {
                memoLines.push("\n【弱点】", ...cocofoliaWeaknesses);
            }

            let skillsMemoTextLines = [];
            this.skills.forEach(skill => {
                if (skill.checked) {
                    let skillLine = `・${skill.name}`;
                    if (skill.canHaveExperts && skill.experts.some(e => e.value && e.value.trim() !== '')) {
                        const expertTexts = skill.experts.filter(e => e.value && e.value.trim() !== '').map(e => e.value);
                        if (expertTexts.length > 0) {
                            skillLine += ` (${expertTexts.join('/')})`;
                        }
                    }
                    skillsMemoTextLines.push(skillLine);
                }
            });
            if (skillsMemoTextLines.length > 0) {
                memoLines.push("\n【技能】", ...skillsMemoTextLines);
            }

            let commands = `1d100>={ダメージ}+${scar} 〈ダメージチェック〉\n1d100>={ストレス} 〈ストレスチェック〉\n:傷痕=${scar}+{ダメージ}/2\n:ダメージ=0\n`;
            this.skills.forEach(skill => {
                const dice = skill.checked ? "2d10" : "1d10";
                commands += `${dice} 〈${skill.name}〉\n`;
                if (skill.checked && skill.canHaveExperts) {
                    skill.experts.forEach(expert => { if (expert.value && expert.value.trim() !== '') commands += `3d10 〈${skill.name}：${expert.value}〉\n`; });
                }
            });

            let specialSkillListText = "";
            this.specialSkills.forEach(ss => {
                if (ss.group && ss.name) {
                    const groupOptions = this.specialSkillData[ss.group] || [];
                    const skillOption = groupOptions.find(opt => opt.value === ss.name);
                    const skillLabel = skillOption ? skillOption.label : ss.name;
                    specialSkillListText += this.specialSkillsRequiringNote.includes(ss.name) && ss.note ? `《${skillLabel}：${ss.note}》` : `《${skillLabel}》`;
                }
            });
            if (specialSkillListText) memoLines.push("\n【特技】", specialSkillListText);

            let equipmentTextLines = [];
            if (this.equipments.weapon1.group || this.equipments.weapon1.name) {
                const groupLabel = this.equipmentGroupLabelMap[this.equipments.weapon1.group] || this.equipments.weapon1.group;
                equipmentTextLines.push(`${this.equipments.weapon1.name || '武器1'}（${groupLabel || '種別なし'}）`);
                if (this.equipments.weapon1.group && this.weaponDamage[this.equipments.weapon1.group]) {
                    commands += `${this.weaponDamage[this.equipments.weapon1.group]} 〈ダメージ判定（${this.equipments.weapon1.name || '武器1'}）〉\n`;
                }
            }
            if (this.equipments.weapon2.group || this.equipments.weapon2.name) {
                const groupLabel = this.equipmentGroupLabelMap[this.equipments.weapon2.group] || this.equipments.weapon2.group;
                equipmentTextLines.push(`${this.equipments.weapon2.name || '武器2'}（${groupLabel || '種別なし'}）`);
                if (this.equipments.weapon2.group && this.weaponDamage[this.equipments.weapon2.group]) {
                    commands += `${this.weaponDamage[this.equipments.weapon2.group]} 〈ダメージ判定（${this.equipments.weapon2.name || '武器2'}）〉\n`;
                }
            }
            if (this.equipments.armor.group || this.equipments.armor.name) {
                const groupLabel = this.equipmentGroupLabelMap[this.equipments.armor.group] || this.equipments.armor.group;
                equipmentTextLines.push(`${this.equipments.armor.name || '防具'}（${groupLabel || '種別なし'}）`);
            }
            if (equipmentTextLines.length > 0) memoLines.push("\n【武器・防具】", ...equipmentTextLines);

            if (this.character.otherItems) {
                memoLines.push("\n【その他所持品】", this.character.otherItems);
            }

            if (this.character.memo) {
                let charMemo = this.character.memo;
                let truncatedCharMemo = "";
                const maxLength = 200;

                if (charMemo.length <= maxLength) {
                    truncatedCharMemo = charMemo;
                } else {
                    let sub = charMemo.substring(0, maxLength);
                    let lastBreak = -1;
                    const breakChars = ['\n', '。', '．'];

                    for (const char of breakChars) {
                        let idx = sub.lastIndexOf(char);
                        if (idx > lastBreak && idx > maxLength / 2) {
                            lastBreak = idx;
                        }
                    }

                    if (lastBreak !== -1) {
                        truncatedCharMemo = charMemo.substring(0, lastBreak + 1) + (charMemo.length > lastBreak + 1 ? "…" : "");
                    } else {
                        truncatedCharMemo = charMemo.substring(0, maxLength) + "…";
                    }
                }
                memoLines.push("\n【キャラクターメモ】", truncatedCharMemo.trim());
            }

            const finalMemo = memoLines.join("\n").trim();
            const cocofoliaCharacter = {
                kind: "character",
                data: {
                    params: [], status: [{ label: "ダメージ", value: 0 }, { label: "傷痕", value: scar }, { label: "ストレス", value: stress }],
                    name: this.character.name || '名無し', initiative: this.currentWeight * -1,
                    memo: finalMemo, externalUrl: "", commands: commands.trim()
                }
            };
            const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
            if (!navigator.clipboard) { this.fallbackCopyTextToClipboard(textToCopy); return; }
            navigator.clipboard.writeText(textToCopy)
                .then(() => { this.outputButtonText = 'コピー完了！'; setTimeout(() => { this.outputButtonText = 'ココフォリア駒出力'; }, 3000); })
                .catch(err => { console.error('Failed to copy: ', err); this.fallbackCopyTextToClipboard(textToCopy); });
        },
        fallbackCopyTextToClipboard(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed"; textArea.style.opacity = "0";
            document.body.appendChild(textArea);
            textArea.focus(); textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.outputButtonText = 'コピー完了！ (fallback)'; setTimeout(() => { this.outputButtonText = 'ココフォリア駒出力'; }, 3000);
                } else {
                    this.outputButtonText = 'コピー失敗 (fallback)'; setTimeout(() => { this.outputButtonText = 'ココフォリア駒出力'; }, 3000);
                }
            } catch (err) {
                this.outputButtonText = 'コピーエラー (fallback)'; setTimeout(() => { this.outputButtonText = 'ココフォリア駒出力'; }, 3000);
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
        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});
app.mount('#app');