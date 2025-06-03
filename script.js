const { createApp, watch, nextTick } = Vue; // `watch` と `nextTick` を Vue からインポート

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
                linkCurrentToInitialScar: true, // **変更点:** デフォルトをtrueに
                memo: '',
                weaknesses: Array(10).fill(null).map(() => ({ text: '', acquired: '--' })),
            },
            skills: [
                { id: 'motion', name: '運動', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'avoidance', name: '回避', checked: false, canHaveExperts: false, experts: [] },
                { id: 'sense', name: '感覚', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'observation', name: '観察', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'technique', name: '技巧', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'shooting', name: '射撃', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'sociality', name: '社交', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'knowledge', name: '知識', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'combat', name: '白兵', checked: false, canHaveExperts: true, experts: [{ value: '' }] },
                { id: 'defense', name: '防御', checked: false, canHaveExperts: false, experts: [] },
            ],
            externalSkillOrder: ['motion', 'avoidance', 'sense', 'observation', 'technique', 'shooting', 'sociality', 'knowledge', 'combat', 'defense'],
            initialSpecialSkillCount: 8,
            specialSkills: Array(8).fill(null).map(() => ({ group: '', name: '', note: '', showNote: false })),
            equipments: {
                weapon1: { group: '', name: '' }, weapon2: { group: '', name: '' }, armor: { group: '', name: '' },
            },
            histories: [
                { sessionName: '', gotExperiments: null, memo: '' }
            ],
            showHelp: false,
            helpText: `
                        <h4>使い方</h4>
                        <ul>
                            <li>「データ保存」ボタンで、入力内容をダウンロードできます。</li>
                            <li>「データ読込」ボタンで、保存したファイルを読み込めます。</li>
                            <li>「ココフォリア駒出力」ボタンをクリックすると、駒データがクリップボードにコピーされます。</li>
                            <li>コピーされたデータをココフォリアのチャット欄に貼り付けることで、キャラクター駒を作成できます。</li>
                        </ul>
                        <h4>注意点</h4>
                        <ul>
                            <li>このツールはブラウザ上で動作し、入力データはサーバーには保存されません。定期的なデータ保存を推奨します。</li>
                        </ul>
                    `,
            outputButtonText: 'ココフォリア駒出力',
            specialSkillData: {
                tactics: [{ value: "concealed_weapon", label: "暗器" }, { value: "fence_off", label: "受け流し" }, { value: "covering_fire", label: "援護射撃" }, { value: "stance", label: "構え" }, { value: "riding_combat", label: "騎乗戦闘" }, { value: "fatal_spot_attack", label: "急所の一撃" }, { value: "high_angle_fire", label: "曲射" }, { value: "ready_to_die", label: "決死の覚悟" }, { value: "martial_arts", label: "拳闘術" }, { value: "escort", label: "護衛" }, { value: "heavy_attack", label: "重撃" }, { value: "risk_attack", label: "捨て身の一撃" }, { value: "machine_gunning", label: "掃射" }, { value: "snipe", label: "狙撃" }, { value: "provoke", label: "挑発" }, { value: "lightning_speed", label: "電光石火" }, { value: "rush", label: "突撃" }, { value: "cleave", label: "凪払い" }, { value: "knock_shooting", label: "弾き落とし" }, { value: "parry", label: "パリィ" }, { value: "feint", label: "フェイント" }, { value: "throw_weapon", label: "武器投げの習熟" }, { value: "break_weapon", label: "武器破壊" }, { value: "fortitude", label: "不屈" }, { value: "gait", label: "歩法" }, { value: "anticipate", label: "見切り" }, { value: "pierce_armor", label: "鎧通し" }],
                magic: [{ value: "light", label: "灯り" }, { value: "dozing", label: "居眠り" }, { value: "enchant", label: "エンチャント" }, { value: "send_sound", label: "音送り" }, { value: "silence", label: "音消し" }, { value: "recovery", label: "回復" }, { value: "read_wind", label: "風読み" }, { value: "activate", label: "活性" }, { value: "fear", label: "恐怖" }, { value: "warning", label: "警報" }, { value: "barrier", label: "結界" }, { value: "illusion", label: "幻影" }, { value: "telecommunication", label: "交信" }, { value: "power_of_word", label: "言霊" }, { value: "ritual_of_spirit", label: "死儀" }, { value: "heal", label: "治癒" }, { value: "calling", label: "通話" }, { value: "familiar", label: "使い魔" }, { value: "ignite", label: "点火" }, { value: "extend_magic", label: "範囲魔術" }, { value: "light_brush", label: "光の筆" }, { value: "cover", label: "被覆" }, { value: "float", label: "浮遊" }, { value: "magic_weapon", label: "魔術の得物" }],
                features: [{ value: "wisdom", label: "叡智" }, { value: "concentrate", label: "過集中" }, { value: "acrobatics", label: "軽業" }, { value: "connivance", label: "看破" }, { value: "thin", label: "希薄" }, { value: "cajolery", label: "口車" }, { value: "connection", label: "コネクション" }, { value: "change_clothes", label: "様変わりの衣" }, { value: "hide_object", label: "仕込み" }, { value: "auto_writing", label: "自動筆記具" }, { value: "pickpocket", label: "スリの極意" }, { value: "instant", label: "即席" }, { value: "infinite_bagpack", label: "底なしの鞄" }, { value: "training", label: "調教" }, { value: "instruction", label: "伝授" }, { value: "cleverness", label: "天性の小手先" }, { value: "adaptability", label: "踏破" }, { value: "cipher", label: "独自暗号" }, { value: "spoofing", label: "なりすまし" }, { value: "beauty", label: "美貌" }, { value: "other_name", label: "二つ名" }, { value: "decompose", label: "分解" }, { value: "honor", label: "誉れ" }, { value: "night_vision", label: "夜目" }]
            },
            specialSkillsRequiringNote: ["enchant", "ritual_of_spirit", "familiar", "magic_weapon", "wisdom", "connection", "hide_object", "training", "spoofing", "other_name", "honor"],
            speciesLabelMap: { "human": "人間", "elf": "エルフ", "dwarf": "ドワーフ", "halfling": "ディグリング", "therianthropy": "獣人", "dragonfolk": "竜人", "treefolk": "ツリーフォーク", "other": "希少人種", "": "未選択" },
            equipmentGroupLabelMap: { "": "なし", "combat_small": "小型白兵武器", "combat_medium": "中型白兵武器", "combat_large": "大型白兵武器", "shooting": "射撃武器", "catalyst": "魔術触媒", "light_armor": "軽装防具", "heavy_armor": "重装防具" },
            weaponDamage: { "": "", "combat_small": "1d4+1", "combat_medium": "1d6+1", "combat_large": "1d10", "shooting": "1d8", "catalyst": "" },
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
    watch: { // **ここから変更点**
        'character.initialScar'(newInitialScar) {
            if (this.character.linkCurrentToInitialScar) {
                this.character.currentScar = newInitialScar;
            }
        },
        'character.linkCurrentToInitialScar'(isLinked) {
            if (isLinked) {
                this.character.currentScar = this.character.initialScar;
            }
        } // **ここまで変更点**
    },
    methods: {
        // **ここから変更点**
        handleCurrentScarInput(event) {
            const enteredValue = parseInt(event.target.value, 10);
            // isNaNチェックを追加して、不正な入力（数値でない場合など）を考慮
            if (isNaN(enteredValue)) {
                // 不正な入力の場合、現在の傷痕を初期傷痕に戻す（連動がオンの場合）
                if (this.character.linkCurrentToInitialScar) {
                    this.$nextTick(() => {
                        this.character.currentScar = this.character.initialScar;
                    });
                }
                return;
            }

            if (this.character.linkCurrentToInitialScar) {
                // 連動がオンの時
                if (enteredValue !== this.character.initialScar) {
                    // 入力された値が初期傷痕と異なる場合、連動を解除
                    this.character.linkCurrentToInitialScar = false;
                    // そして、入力された値を現在の傷痕に設定する
                    // ただし、v-modelで既にcurrentScarは更新されているはずなので、
                    // ここで再度設定する必要はないかもしれないが、明示的に行う
                    this.character.currentScar = enteredValue;
                }
                // 入力された値が初期傷痕と同じ場合は、何もしない（連動は維持される）
            } else {
                // 連動がオフの時は、v-modelによって currentScar は既に入力値で更新されている
                // 何もする必要はない
            }
        },
        // **ここまで変更点**
        hasSpecialSkillContent(ss) { return !!(ss.group || ss.name || ss.note); },
        hasHistoryContent(h) { return !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo); },

        addSpecialSkillItem() {
            if (this.specialSkills.length < 20) {
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
            if (this.specialSkills[index]) { const group = this.specialSkills[index].group; return this.specialSkillData[group] || []; }
            return [];
        },
        updateSpecialSkillOptions(index) {
            if (this.specialSkills[index]) { this.specialSkills[index].name = ''; this.updateSpecialSkillNoteVisibility(index); }
        },
        updateSpecialSkillNoteVisibility(index) {
            if (this.specialSkills[index]) { const skillName = this.specialSkills[index].name; this.specialSkills[index].showNote = this.specialSkillsRequiringNote.includes(skillName); }
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
                    linkCurrentToInitialScar: typeof externalData.linkCurrentToInitialScar === 'boolean' ? externalData.linkCurrentToInitialScar : true, // **変更点**
                    memo: externalData.character_memo || '',
                    weaknesses: Array(10).fill(null).map(() => ({ text: '', acquired: '--' }))
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
                    const appSkillDefinition = this.skills.find(s => s.id === skillId);
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
                internalData.skills = JSON.parse(JSON.stringify(this.skills));
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
                currentScar: 0, initialScar: 0, linkCurrentToInitialScar: true, memo: '', // **変更点**
                weaknesses: Array(10).fill(null).map(() => ({ text: '', acquired: '--' }))
            };
            this.character = { ...defaultCharacter, ...(dataToParse.character || {}) };
            if (typeof this.character.linkCurrentToInitialScar === 'undefined') { // **変更点**
                this.character.linkCurrentToInitialScar = true;
            }

            if (this.character.weaknesses && Array.isArray(this.character.weaknesses)) {
                const numMissingWeaknesses = 10 - this.character.weaknesses.length;
                if (numMissingWeaknesses > 0) {
                    for (let i = 0; i < numMissingWeaknesses; i++) {
                        this.character.weaknesses.push({ text: '', acquired: '--' });
                    }
                } else if (this.character.weaknesses.length > 10) {
                    this.character.weaknesses = this.character.weaknesses.slice(0, 10);
                }
            } else {
                this.character.weaknesses = Array(10).fill(null).map(() => ({ text: '', acquired: '--' }));
            }

            const baseSkills = JSON.parse(JSON.stringify(this.$options.data().skills));
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
            const targetSpecialSkillsLength = Math.min(Math.max(this.initialSpecialSkillCount, loadedSSCount), 20);
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
        // 初期ロード時に連動がオンなら現在の傷痕を初期傷痕に設定
        if (this.character.linkCurrentToInitialScar) {
            this.character.currentScar = this.character.initialScar;
        }
    }
});
app.mount('#app');