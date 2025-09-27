import { defineStore } from 'pinia';
import { AioniaGameData } from '../data/gameData.js';
import { messages } from '../locales/ja.js';
import { deepClone, createWeaknessArray } from '../utils/utils.js';
import { createRandomId } from '../utils/id.js';

function createCharacter() {
  const base = deepClone(AioniaGameData.defaultCharacterData);
  base.weaknesses = createWeaknessArray(AioniaGameData.config.maxWeaknesses);
  if (!base.imageFolderId) {
    base.imageFolderId = createRandomId('imgfld');
  }
  return base;
}

function baseSkills() {
  return deepClone(AioniaGameData.baseSkills);
}

function baseSpecialSkills() {
  return Array(AioniaGameData.config.initialSpecialSkillCount)
    .fill(null)
    .map(() => ({ group: '', name: '', note: '', showNote: false }));
}

function baseEquipments() {
  return {
    weapon1: { group: '', name: '' },
    weapon2: { group: '', name: '' },
    armor: { group: '', name: '' },
  };
}

function baseHistories() {
  return [{ sessionName: '', gotExperiments: null, memo: '' }];
}

export const useCharacterStore = defineStore('character', {
  state: () => ({
    character: createCharacter(),
    skills: baseSkills(),
    specialSkills: baseSpecialSkills(),
    equipments: baseEquipments(),
    histories: baseHistories(),
  }),
  getters: {
    maxExperiencePoints(state) {
      const initialScarExp = Number(state.character.initialScar) || 0;
      const creationWeaknessExp = state.character.weaknesses.reduce(
        (sum, weakness) =>
          sum +
          (weakness.text && weakness.text.trim() !== '' && weakness.acquired === '作成時'
            ? AioniaGameData.experiencePointValues.weakness
            : 0),
        0,
      );
      const combinedInitialBonus = Math.min(initialScarExp + creationWeaknessExp, AioniaGameData.experiencePointValues.maxInitialBonus);
      const historyExp = state.histories.reduce((sum, h) => sum + (Number(h.gotExperiments) || 0), 0);
      return AioniaGameData.experiencePointValues.basePoints + combinedInitialBonus + historyExp;
    },
    currentExperiencePoints(state) {
      const skillExp = state.skills.reduce((sum, s) => sum + (s.checked ? AioniaGameData.experiencePointValues.skillBase : 0), 0);
      const expertExp = state.skills.reduce((sum, s) => {
        if (s.checked && s.canHaveExperts) {
          return (
            sum +
            s.experts.reduce(
              (expSum, exp) => expSum + (exp.value && exp.value.trim() !== '' ? AioniaGameData.experiencePointValues.expertSkill : 0),
              0,
            )
          );
        }
        return sum;
      }, 0);
      const specialSkillExp = state.specialSkills.reduce(
        (sum, ss) => sum + (ss.name && ss.name.trim() !== '' ? AioniaGameData.experiencePointValues.specialSkill : 0),
        0,
      );
      return skillExp + expertExp + specialSkillExp;
    },
    currentWeight(state) {
      const weaponWeights = AioniaGameData.equipmentWeights.weapon;
      const armorWeights = AioniaGameData.equipmentWeights.armor;
      let weight = 0;
      weight += weaponWeights[state.equipments.weapon1.group] || 0;
      weight += weaponWeights[state.equipments.weapon2.group] || 0;
      weight += armorWeights[state.equipments.armor.group] || 0;
      return weight;
    },
    sessionNamesForWeaknessDropdown(state) {
      const defaultOptions = [...AioniaGameData.weaknessAcquisitionOptions];
      const sessionOptions = state.histories
        .map((h) => h.sessionName)
        .filter((name) => name && name.trim() !== '')
        .map((name) => ({ value: name, text: name, disabled: false }));
      const helpOption = {
        value: 'help-text',
        text: messages.weaknessDropdownHelp,
        disabled: true,
      };
      return defaultOptions.concat(sessionOptions, helpOption);
    },
  },
  actions: {
    _manageListItem({ list, action, index, newItemFactory, hasContentChecker, maxLength }) {
      if (action === 'add') {
        if (maxLength && list.length >= maxLength) return;
        const newItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
        list.push(typeof newItem === 'object' && newItem !== null ? deepClone(newItem) : newItem);
      } else if (action === 'remove') {
        if (list.length > 1) {
          list.splice(index, 1);
        } else if (list.length === 1 && hasContentChecker && hasContentChecker(list[index])) {
          const emptyItem = typeof newItemFactory === 'function' ? newItemFactory() : newItemFactory;
          list[index] = typeof emptyItem === 'object' && emptyItem !== null ? deepClone(emptyItem) : emptyItem;
        }
      }
    },
    addSpecialSkillItem() {
      this._manageListItem({
        list: this.specialSkills,
        action: 'add',
        newItemFactory: () => ({
          group: '',
          name: '',
          note: '',
          showNote: false,
        }),
        maxLength: AioniaGameData.config.maxSpecialSkills,
      });
    },
    removeSpecialSkill(index) {
      this._manageListItem({
        list: this.specialSkills,
        action: 'remove',
        index,
        newItemFactory: () => ({
          group: '',
          name: '',
          note: '',
          showNote: false,
        }),
        hasContentChecker: (ss) => !!(ss.group || ss.name || ss.note),
      });
    },
    addHistoryItem() {
      this._manageListItem({
        list: this.histories,
        action: 'add',
        newItemFactory: () => ({
          sessionName: '',
          gotExperiments: null,
          memo: '',
        }),
      });
    },
    removeHistoryItem(index) {
      this._manageListItem({
        list: this.histories,
        action: 'remove',
        index,
        newItemFactory: () => ({
          sessionName: '',
          gotExperiments: null,
          memo: '',
        }),
        hasContentChecker: (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo),
      });
    },
    addExpert(skillId) {
      const skill = this.skills.find((s) => s.id === skillId);
      if (skill && skill.canHaveExperts) {
        this._manageListItem({
          list: skill.experts,
          action: 'add',
          newItemFactory: () => ({ value: '' }),
        });
      }
    },
    removeExpert(skillId, expertIndex) {
      const skill = this.skills.find((s) => s.id === skillId);
      if (skill && skill.canHaveExperts) {
        this._manageListItem({
          list: skill.experts,
          action: 'remove',
          index: expertIndex,
          newItemFactory: () => ({ value: '' }),
          hasContentChecker: (e) => e.value && e.value.trim() !== '',
        });
      }
    },
    updateHistoryItem(index, field, value) {
      if (this.histories[index]) {
        this.histories[index][field] = field === 'gotExperiments' && value !== '' && value !== null ? Number(value) : value;
      }
    },
    handleSpeciesChange() {
      if (this.character.species !== 'other') this.character.rareSpecies = '';
    },
    initializeAll() {
      Object.assign(this.character, createCharacter());
      this.skills.splice(0, this.skills.length, ...baseSkills());
      this.specialSkills.splice(0, this.specialSkills.length, ...baseSpecialSkills());
      Object.assign(this.equipments, baseEquipments());
      this.histories.splice(0, this.histories.length, ...baseHistories());
    },
  },
});
