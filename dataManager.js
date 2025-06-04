/**
 * データ管理系の機能を担当するクラス
 */
class DataManager {
  constructor(gameData) {
    this.gameData = gameData;
  }

  /**
   * キャラクターデータを保存
   */
  saveData(character, skills, specialSkills, equipments, histories) {
    const dataToSave = {
      character: character,
      skills: skills.map(s => ({
        id: s.id,
        checked: s.checked,
        canHaveExperts: s.canHaveExperts,
        experts: s.canHaveExperts
          ? s.experts.filter(e => e.value && e.value.trim() !== '').map(e => ({ value: e.value }))
          : []
      })),
      specialSkills: specialSkills.filter(ss => ss.group && ss.name),
      equipments: equipments,
      histories: histories.filter(h =>
        h.sessionName ||
        (h.gotExperiments !== null && h.gotExperiments !== '') ||
        h.memo
      )
    };

    const jsonData = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const filename = character.name || 'Aionia_Character';
    a.download = `${filename}_AioniaSheet.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * ファイルアップロードを処理
   */
  handleFileUpload(event, onSuccess, onError) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      try {
        const rawJsonData = JSON.parse(fileContent);
        const parsedData = this.parseLoadedData(rawJsonData);
        onSuccess(parsedData);
      } catch (error) {
        console.error("Failed to parse JSON file:", error);
        onError(this.gameData.uiMessages.fileLoadError);
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  }

  /**
   * 外部JSONフォーマットを内部フォーマットに変換
   */
  convertExternalJsonToInternalFormat(externalData) {
    const internalData = {
      character: {
        name: externalData.name || '',
        playerName: externalData.player || '',
        species: externalData.species || '',
        rareSpecies: externalData.rare_species || '',
        occupation: externalData.occupation || '',
        age: externalData.age ? parseInt(externalData.age, 10) : null,
        gender: externalData.gender || '',
        height: externalData.height || '',
        weight: externalData.weight || '',
        origin: externalData.origin || '',
        faith: externalData.faith || '',
        otherItems: externalData.otherItems || '',
        initialScar: externalData.init_scar ? parseInt(externalData.init_scar, 10) : 0,
        currentScar: externalData.init_scar ? parseInt(externalData.init_scar, 10) : 0,
        linkCurrentToInitialScar: typeof externalData.linkCurrentToInitialScar === 'boolean'
          ? externalData.linkCurrentToInitialScar
          : true,
        memo: externalData.character_memo || '',
        weaknesses: createWeaknessArray(this.gameData.config.maxWeaknesses)
      },
      skills: [],
      specialSkills: [],
      equipments: {
        weapon1: { group: '', name: '' },
        weapon2: { group: '', name: '' },
        armor: { group: '', name: '' }
      },
      histories: []
    };

    // 弱点データの変換
    if (externalData.init_weakness1) {
      internalData.character.weaknesses[0] = {
        text: externalData.init_weakness1,
        acquired: '作成時'
      };
    }
    if (externalData.init_weakness2) {
      internalData.character.weaknesses[1] = {
        text: externalData.init_weakness2,
        acquired: '作成時'
      };
    }

    // スキルデータの変換
    this._convertSkillsData(externalData, internalData);

    // 特技データの変換
    this._convertSpecialSkillsData(externalData, internalData);

    // 装備データの変換
    this._convertEquipmentData(externalData, internalData);

    // 履歴データの変換
    this._convertHistoryData(externalData, internalData);

    return internalData;
  }

  /**
   * 読み込まれたデータを解析
   */
  parseLoadedData(rawJsonData) {
    let dataToParse = rawJsonData;

    // フォーマット判定と変換
    if (this._isExternalFormat(rawJsonData)) {
      console.log("External JSON format (bright-trpg tool) detected, converting...");
      dataToParse = this.convertExternalJsonToInternalFormat(rawJsonData);
    } else if (this._isInternalFormat(rawJsonData)) {
      console.log("Internal JSON format (this tool) detected.");
    } else {
      console.warn("Unknown JSON format, attempting to parse as is. Data integrity not guaranteed.");
      dataToParse = {
        character: {},
        skills: [],
        specialSkills: [],
        equipments: {},
        histories: [],
        ...rawJsonData
      };
    }

    return this._normalizeLoadedData(dataToParse);
  }

  // プライベートメソッド
  _isExternalFormat(data) {
    return data &&
      typeof data.player !== 'undefined' &&
      typeof data.character_memo !== 'undefined';
  }

  _isInternalFormat(data) {
    return data &&
      data.character &&
      typeof data.character.playerName !== 'undefined';
  }

  _convertSkillsData(externalData, internalData) {
    if (externalData.skills && Array.isArray(externalData.skills)) {
      this.gameData.externalSkillOrder.forEach((skillId, index) => {
        const appSkillDefinition = this.gameData.baseSkills.find(s => s.id === skillId);
        if (appSkillDefinition && externalData.skills[index]) {
          const externalSkill = externalData.skills[index];
          const newSkill = {
            id: appSkillDefinition.id,
            name: appSkillDefinition.name,
            checked: !!externalSkill.selected,
            canHaveExperts: appSkillDefinition.canHaveExperts,
            experts: []
          };

          if (newSkill.checked && newSkill.canHaveExperts) {
            if (externalSkill.expert_skills && externalSkill.expert_skills.length > 0) {
              newSkill.experts = externalSkill.expert_skills
                .map(es => ({ value: es || '' }))
                .filter(e => e.value);
            }
            if (newSkill.experts.length === 0) {
              newSkill.experts.push({ value: '' });
            }
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
  }

  _convertSpecialSkillsData(externalData, internalData) {
    if (externalData.special_skills && Array.isArray(externalData.special_skills)) {
      internalData.specialSkills = externalData.special_skills
        .filter(ss => ss.group && ss.name)
        .map(ss => ({
          group: ss.group || '',
          name: ss.name || '',
          note: ss.note || '',
          showNote: this.gameData.specialSkillsRequiringNote.includes(ss.name || '')
        }));
    }
  }

  _convertEquipmentData(externalData, internalData) {
    if (externalData.weapon1_type || externalData.weapon1_name) {
      internalData.equipments.weapon1 = {
        group: externalData.weapon1_type || '',
        name: externalData.weapon1_name || ''
      };
    }
    if (externalData.weapon2_type || externalData.weapon2_name) {
      internalData.equipments.weapon2 = {
        group: externalData.weapon2_type || '',
        name: externalData.weapon2_name || ''
      };
    }
    if (externalData.armor_type || externalData.armor_name) {
      internalData.equipments.armor = {
        group: externalData.armor_type || '',
        name: externalData.armor_name || ''
      };
    }
  }

  _convertHistoryData(externalData, internalData) {
    if (externalData.history && Array.isArray(externalData.history)) {
      internalData.histories = externalData.history.map(h => ({
        sessionName: h.name || '',
        gotExperiments: h.experiments ? parseInt(h.experiments, 10) : null,
        memo: h.stress || h.memo || ''
      }));
    }
  }

  _normalizeLoadedData(dataToParse) {
    // キャラクターデータの正規化
    const defaultCharacter = {
      ...this.gameData.defaultCharacterData,
      weaknesses: createWeaknessArray(this.gameData.config.maxWeaknesses)
    };

    const normalizedData = {
      character: { ...defaultCharacter, ...(dataToParse.character || {}) },
      skills: this._normalizeSkillsData(dataToParse.skills),
      specialSkills: this._normalizeSpecialSkillsData(dataToParse.specialSkills),
      equipments: this._normalizeEquipmentData(dataToParse.equipments),
      histories: this._normalizeHistoryData(dataToParse.histories)
    };

    if (typeof normalizedData.character.linkCurrentToInitialScar === 'undefined') {
      normalizedData.character.linkCurrentToInitialScar = true;
    }

    return normalizedData;
  }

  _normalizeSkillsData(skillsData) {
    const baseSkills = JSON.parse(JSON.stringify(this.gameData.baseSkills));

    if (skillsData && Array.isArray(skillsData)) {
      const loadedSkillsById = new Map(skillsData.map(s => [s.id, s]));

      return baseSkills.map(appSkill => {
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
    }

    return baseSkills;
  }

  _normalizeSpecialSkillsData(specialSkillsData) {
    let loadedSSCount = 0;
    if (specialSkillsData && Array.isArray(specialSkillsData)) {
      loadedSSCount = specialSkillsData.length;
    }

    const targetLength = Math.min(
      Math.max(this.gameData.config.initialSpecialSkillCount, loadedSSCount),
      this.gameData.config.maxSpecialSkills
    );

    const normalizedSpecialSkills = [];
    for (let i = 0; i < targetLength; i++) {
      if (specialSkillsData && i < specialSkillsData.length) {
        const loadedSS = specialSkillsData[i];
        normalizedSpecialSkills.push({
          group: loadedSS.group || '',
          name: loadedSS.name || '',
          note: loadedSS.note || '',
          showNote: this.gameData.specialSkillsRequiringNote.includes(loadedSS.name || '')
        });
      } else {
        normalizedSpecialSkills.push({
          group: '',
          name: '',
          note: '',
          showNote: false
        });
      }
    }

    return normalizedSpecialSkills;
  }

  _normalizeEquipmentData(equipmentData) {
    if (equipmentData) {
      return {
        weapon1: { group: '', name: '', ...(equipmentData.weapon1 || {}) },
        weapon2: { group: '', name: '', ...(equipmentData.weapon2 || {}) },
        armor: { group: '', name: '', ...(equipmentData.armor || {}) }
      };
    }

    return {
      weapon1: { group: '', name: '' },
      weapon2: { group: '', name: '' },
      armor: { group: '', name: '' }
    };
  }

  _normalizeHistoryData(historyData) {
    if (historyData && historyData.length > 0) {
      return historyData.map(h => ({
        sessionName: h.sessionName || '',
        gotExperiments: (h.gotExperiments === null || h.gotExperiments === undefined || h.gotExperiments === '')
          ? null
          : Number(h.gotExperiments),
        memo: h.memo || ''
      }));
    }

    return [{ sessionName: '', gotExperiments: null, memo: '' }];
  }
}

// グローバルに公開
window.DataManager = DataManager;