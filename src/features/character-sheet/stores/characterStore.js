import { defineStore } from 'pinia';
import { AioniaGameData } from '@/data/gameData.js';
import { messages } from '@/i18n/index.js';
import { deepClone, createWeaknessArray } from '@/shared/utils/utils.js';

function generateUniqueId(existingIds = new Set()) {
  let id = '';
  do {
    const cryptoApi = globalThis.crypto;
    id = typeof cryptoApi?.randomUUID === 'function' ? cryptoApi.randomUUID() : Math.random().toString(36).slice(2, 10);
  } while (existingIds.has(id));
  return id;
}

function normalizeSubMemo(subMemo, existingIds) {
  const sanitizedMemo = subMemo && typeof subMemo === 'object' ? subMemo : {};
  const memoId = sanitizedMemo.id && !existingIds.has(sanitizedMemo.id) ? sanitizedMemo.id : generateUniqueId(existingIds);
  existingIds.add(memoId);
  return {
    id: memoId,
    title: sanitizedMemo.title ?? '',
    content: sanitizedMemo.content ?? '',
    isSpoiler: Boolean(sanitizedMemo.isSpoiler),
  };
}

function normalizeSubMemos(list = []) {
  const existingIds = new Set();
  const source = Array.isArray(list) ? list : [];
  return source.map((memo) => normalizeSubMemo(memo, existingIds));
}

function createCharacter() {
  const base = deepClone(AioniaGameData.defaultCharacterData);
  base.weaknesses = createWeaknessArray(AioniaGameData.config.maxWeaknesses);
  base.subMemos = normalizeSubMemos(base.subMemos);
  return base;
}

function baseSkills() {
  return deepClone(AioniaGameData.baseSkills);
}

function createSpecialSkill() {
  return {
    group: '',
    name: '',
    note: '',
    showNote: false,
    acquired: '経験点消費',
  };
}

function baseSpecialSkills() {
  return Array(AioniaGameData.config.initialSpecialSkillCount).fill(null).map(createSpecialSkill);
}

function baseEquipments() {
  return {
    weapon1: { group: '', name: '' },
    weapon2: { group: '', name: '' },
    armor: { group: '', name: '' },
  };
}

function baseAdventureLogEntry() {
  return { sessionName: '', gotExperiments: null, memo: '', increasedScar: null };
}

function baseHistories() {
  return [baseAdventureLogEntry()];
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
    adventureLog(state) {
      return state.histories;
    },
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
        (sum, ss) =>
          sum + (ss.name && ss.name.trim() !== '' && ss.acquired === '経験点消費' ? AioniaGameData.experiencePointValues.specialSkill : 0),
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
    calculatedScar(state) {
      const initialScar = Number(state.character.initialScar) || 0;
      const adventureScar = state.histories.reduce((sum, history) => sum + (Number(history?.increasedScar) || 0), 0);
      return initialScar + adventureScar;
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
    acquisitionOptionsForSpecialSkills(state) {
      const staticOptions = [{ value: '経験点消費', text: '経験点消費', disabled: false }];
      const sessionOptions = state.histories
        .map((h) => h.sessionName)
        .filter((name) => name && name.trim() !== '')
        .map((name) => ({ value: name, text: name, disabled: false }));
      const helpOption = {
        value: 'help-text',
        text: messages.specialSkillDropdownHelp,
        disabled: true,
      };
      return [...staticOptions, ...sessionOptions, helpOption];
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
    addSubMemo(payload = {}) {
      const list = Array.isArray(this.character.subMemos) ? this.character.subMemos : [];
      this.character.subMemos = list;
      const existingIds = new Set(list.map((memo) => memo.id).filter(Boolean));
      const newMemo = normalizeSubMemo({ ...payload, isSpoiler: payload.isSpoiler ?? false }, existingIds);
      list.push(newMemo);
      return newMemo;
    },
    updateSubMemo(id, updates = {}) {
      if (!Array.isArray(this.character.subMemos)) return null;
      const target = this.character.subMemos.find((memo) => memo.id === id);
      if (!target) return null;
      if ('title' in updates) {
        target.title = updates.title ?? '';
      }
      if ('content' in updates) {
        target.content = updates.content ?? '';
      }
      if ('isSpoiler' in updates) {
        target.isSpoiler = Boolean(updates.isSpoiler);
      }
      return target;
    },
    removeSubMemo(id) {
      if (!Array.isArray(this.character.subMemos)) return;
      const index = this.character.subMemos.findIndex((memo) => memo.id === id);
      if (index !== -1) {
        this.character.subMemos.splice(index, 1);
      }
    },
    addSpecialSkillItem() {
      this._manageListItem({
        list: this.specialSkills,
        action: 'add',
        newItemFactory: createSpecialSkill,
        maxLength: AioniaGameData.config.maxSpecialSkills,
      });
    },
    removeSpecialSkill(index) {
      this._manageListItem({
        list: this.specialSkills,
        action: 'remove',
        index,
        newItemFactory: createSpecialSkill,
        hasContentChecker: (ss) => !!(ss.group || ss.name || ss.note),
      });
    },
    addHistoryItem() {
      this._manageListItem({
        list: this.histories,
        action: 'add',
        newItemFactory: () => baseAdventureLogEntry(),
      });
    },
    removeHistoryItem(index) {
      this._manageListItem({
        list: this.histories,
        action: 'remove',
        index,
        newItemFactory: () => baseAdventureLogEntry(),
        hasContentChecker: (h) => {
          return !!(
            h.sessionName ||
            (h.gotExperiments !== null && h.gotExperiments !== '') ||
            (h.increasedScar !== null && h.increasedScar !== undefined) ||
            h.memo
          );
        },
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
        if (field === 'gotExperiments') {
          this.histories[index][field] = value !== '' && value !== null ? Number(value) : null;
        } else if (field === 'increasedScar') {
          this.histories[index][field] = value !== '' && value !== null ? Number(value) : null;
        } else {
          this.histories[index][field] = value;
        }
      }
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
