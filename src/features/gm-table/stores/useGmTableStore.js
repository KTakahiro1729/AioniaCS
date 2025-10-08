import { defineStore } from 'pinia';

function cloneData(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function createId() {
  const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }
  return `gm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultWindowState = () => ({
  top: 120,
  left: 40,
  width: 360,
  height: 420,
  minimized: false,
});

export const useGmTableStore = defineStore('gmTable', {
  state: () => ({
    columns: [],
    sessionMemo: '',
    rowVisibility: {
      memo: true,
      weaknesses: false,
    },
    skillDetailExpanded: false,
    sessionWindow: defaultWindowState(),
  }),
  getters: {
    hasCharacters(state) {
      return state.columns.length > 0;
    },
  },
  actions: {
    addCharacter({ parsedData, sourceName }) {
      if (!parsedData) return;
      this.columns.push({
        id: createId(),
        data: cloneData(parsedData),
        memo: '',
        sourceName: sourceName || '',
        updatedAt: Date.now(),
      });
    },
    replaceCharacter(id, { parsedData, sourceName }) {
      const index = this.columns.findIndex((column) => column.id === id);
      if (index === -1 || !parsedData) {
        return;
      }
      const target = this.columns[index];
      this.columns[index] = {
        ...target,
        data: cloneData(parsedData),
        sourceName: sourceName || target.sourceName || '',
        updatedAt: Date.now(),
      };
    },
    removeCharacter(id) {
      this.columns = this.columns.filter((column) => column.id !== id);
    },
    setCharacterMemo(id, value) {
      const target = this.columns.find((column) => column.id === id);
      if (target) {
        target.memo = value;
      }
    },
    toggleRow(key) {
      if (Object.prototype.hasOwnProperty.call(this.rowVisibility, key)) {
        this.rowVisibility[key] = !this.rowVisibility[key];
      }
    },
    setSkillDetailExpanded(value) {
      this.skillDetailExpanded = !!value;
    },
    updateSessionMemo(value) {
      this.sessionMemo = value;
    },
    updateSessionWindow(partial) {
      this.sessionWindow = {
        ...this.sessionWindow,
        ...partial,
      };
    },
    resetWindowState() {
      this.sessionWindow = defaultWindowState();
    },
    toSessionPayload() {
      return {
        version: 1,
        sessionMemo: this.sessionMemo,
        rowVisibility: { ...this.rowVisibility },
        skillDetailExpanded: this.skillDetailExpanded,
        sessionWindow: { ...this.sessionWindow },
        characters: this.columns.map((column) => ({
          id: column.id,
          memo: column.memo,
          sourceName: column.sourceName,
          updatedAt: column.updatedAt,
          data: cloneData(column.data),
        })),
      };
    },
    loadFromSession(payload) {
      if (!payload || typeof payload !== 'object') return;
      const { sessionMemo = '', rowVisibility = {}, skillDetailExpanded = false, sessionWindow = null, characters = [] } = payload;

      this.sessionMemo = sessionMemo || '';
      this.rowVisibility = {
        memo: typeof rowVisibility.memo === 'boolean' ? rowVisibility.memo : true,
        weaknesses: typeof rowVisibility.weaknesses === 'boolean' ? rowVisibility.weaknesses : false,
      };
      this.skillDetailExpanded = !!skillDetailExpanded;
      this.sessionWindow = sessionWindow ? { ...defaultWindowState(), ...sessionWindow } : defaultWindowState();
      this.columns = Array.isArray(characters)
        ? characters.map((column) => ({
            id: column.id || createId(),
            memo: column.memo || '',
            sourceName: column.sourceName || '',
            updatedAt: column.updatedAt || Date.now(),
            data: cloneData(column.data || {}),
          }))
        : [];
    },
  },
});
