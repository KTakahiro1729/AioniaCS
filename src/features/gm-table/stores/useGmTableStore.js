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

const MIN_MEMO_WIDTH = 260;
const MIN_MEMO_HEIGHT = 180;

const defaultMemoLayout = () => ({
  position: 'bottom',
  width: 360,
  height: 260,
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
    sessionMemoLayout: defaultMemoLayout(),
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
    updateSessionMemoLayout(partial) {
      if (!partial || typeof partial !== 'object') return;
      const next = { ...this.sessionMemoLayout };
      if (partial.position && ['bottom', 'left', 'right'].includes(partial.position)) {
        next.position = partial.position;
      }
      if (Object.prototype.hasOwnProperty.call(partial, 'width')) {
        const width = Number(partial.width);
        if (!Number.isNaN(width)) {
          next.width = Math.max(MIN_MEMO_WIDTH, width);
        }
      }
      if (Object.prototype.hasOwnProperty.call(partial, 'height')) {
        const height = Number(partial.height);
        if (!Number.isNaN(height)) {
          next.height = Math.max(MIN_MEMO_HEIGHT, height);
        }
      }
      this.sessionMemoLayout = next;
    },
    resetMemoLayout() {
      this.sessionMemoLayout = defaultMemoLayout();
    },
    toSessionPayload() {
      return {
        version: 1,
        sessionMemo: this.sessionMemo,
        rowVisibility: { ...this.rowVisibility },
        skillDetailExpanded: this.skillDetailExpanded,
        sessionMemoLayout: { ...this.sessionMemoLayout },
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
      const {
        sessionMemo = '',
        rowVisibility = {},
        skillDetailExpanded = false,
        sessionMemoLayout = null,
        sessionWindow = null,
        characters = [],
      } = payload;

      this.sessionMemo = sessionMemo || '';
      this.rowVisibility = {
        memo: typeof rowVisibility.memo === 'boolean' ? rowVisibility.memo : true,
        weaknesses: typeof rowVisibility.weaknesses === 'boolean' ? rowVisibility.weaknesses : false,
      };
      this.skillDetailExpanded = !!skillDetailExpanded;
      if (sessionMemoLayout && typeof sessionMemoLayout === 'object') {
        this.sessionMemoLayout = defaultMemoLayout();
        this.updateSessionMemoLayout(sessionMemoLayout);
      } else if (sessionWindow && typeof sessionWindow === 'object') {
        const { width = 360, height = 260 } = sessionWindow;
        this.sessionMemoLayout = defaultMemoLayout();
        this.updateSessionMemoLayout({ width, height });
      } else {
        this.sessionMemoLayout = defaultMemoLayout();
      }
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
