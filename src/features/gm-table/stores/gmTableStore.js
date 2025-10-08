import { defineStore } from 'pinia';
import { AioniaGameData } from '@/data/gameData.js';

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gm-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function normalizePosition(value) {
  const x = Number.isFinite(value?.x) ? value.x : 32;
  const y = Number.isFinite(value?.y) ? value.y : 32;
  return { x, y };
}

function normalizeSize(value) {
  const width = Number.isFinite(value?.width) ? Math.max(240, value.width) : 360;
  const height = Number.isFinite(value?.height) ? Math.max(200, value.height) : 320;
  return { width, height };
}

export const useGmTableStore = defineStore('gm-table', {
  state: () => ({
    characters: [],
    rowState: {
      memoVisible: true,
      weaknessesExpanded: false,
      skillsDetailed: false,
    },
    sessionMemo: {
      text: '',
      minimized: false,
      position: { x: 32, y: 32 },
      size: { width: 360, height: 320 },
    },
  }),
  getters: {
    hasCharacters: (state) => state.characters.length > 0,
    baseSkills: () => AioniaGameData.baseSkills.slice(0, 10),
    specialSkillDictionary: () => {
      const result = new Map();
      Object.values(AioniaGameData.specialSkillData).forEach((group) => {
        group.forEach((item) => {
          result.set(item.label, item.description || '');
        });
      });
      return result;
    },
  },
  actions: {
    addCharacter({ parsedData, file, memo = '' }) {
      if (!parsedData) return;
      const id = createId();
      const entry = {
        id,
        data: parsedData,
        memo,
        sourceFile: file || null,
      };
      this.characters.push(entry);
    },
    upsertCharacterFromSnapshot(snapshot) {
      if (!snapshot?.data) return;
      const id = snapshot.id || createId();
      const targetIndex = this.characters.findIndex((c) => c.id === id);
      const entry = {
        id,
        data: snapshot.data,
        memo: snapshot.memo || '',
        sourceFile: null,
      };
      if (targetIndex >= 0) {
        this.characters.splice(targetIndex, 1, entry);
      } else {
        this.characters.push(entry);
      }
    },
    updateCharacterData(id, parsedData) {
      const target = this.characters.find((c) => c.id === id);
      if (!target || !parsedData) return;
      target.data = parsedData;
    },
    updateCharacterFile(id, file) {
      const target = this.characters.find((c) => c.id === id);
      if (!target) return;
      target.sourceFile = file || null;
    },
    removeCharacter(id) {
      this.characters = this.characters.filter((c) => c.id !== id);
    },
    updateCharacterMemo(id, value) {
      const target = this.characters.find((c) => c.id === id);
      if (!target) return;
      target.memo = value;
    },
    setMemoVisibility(visible) {
      this.rowState.memoVisible = Boolean(visible);
    },
    toggleMemoVisibility() {
      this.rowState.memoVisible = !this.rowState.memoVisible;
    },
    toggleWeaknessExpansion() {
      this.rowState.weaknessesExpanded = !this.rowState.weaknessesExpanded;
    },
    toggleSkillsDetail() {
      this.rowState.skillsDetailed = !this.rowState.skillsDetailed;
    },
    setSessionMemoText(value) {
      this.sessionMemo.text = value;
    },
    setSessionMemoMinimized(value) {
      this.sessionMemo.minimized = Boolean(value);
    },
    setSessionMemoPosition(position) {
      this.sessionMemo.position = normalizePosition(position);
    },
    setSessionMemoSize(size) {
      this.sessionMemo.size = normalizeSize(size);
    },
    replaceState(payload) {
      this.characters = [];
      if (Array.isArray(payload?.characters)) {
        payload.characters.forEach((character) => {
          this.upsertCharacterFromSnapshot(character);
        });
      }
      if (payload?.rowState) {
        this.rowState.memoVisible = Boolean(payload.rowState.memoVisible);
        this.rowState.weaknessesExpanded = Boolean(payload.rowState.weaknessesExpanded);
        this.rowState.skillsDetailed = Boolean(payload.rowState.skillsDetailed);
      }
      if (payload?.sessionMemo) {
        this.sessionMemo.text = payload.sessionMemo.text || '';
        this.sessionMemo.minimized = Boolean(payload.sessionMemo.minimized);
        this.sessionMemo.position = normalizePosition(payload.sessionMemo.position);
        this.sessionMemo.size = normalizeSize(payload.sessionMemo.size);
      }
    },
    exportSnapshot() {
      return {
        characters: this.characters.map((character) => ({
          id: character.id,
          memo: character.memo,
          data: character.data,
          sourceFileName: character.sourceFile?.name || null,
        })),
        rowState: { ...this.rowState },
        sessionMemo: {
          text: this.sessionMemo.text,
          minimized: this.sessionMemo.minimized,
          position: { ...this.sessionMemo.position },
          size: { ...this.sessionMemo.size },
        },
      };
    },
  },
});
