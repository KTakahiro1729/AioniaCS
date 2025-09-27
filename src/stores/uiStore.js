import { defineStore } from 'pinia';
import { useCharacterStore } from './characterStore.js';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isCloudSaveSuccess: false,
    isSignedIn: false,
    isLoading: false,
    currentCloudFileId: null,
    isViewingShared: false,
    cloudCharacters: [],
    pendingCloudSaves: {},
    showHeader: true,
  }),
  getters: {
    experienceStatusClass() {
      const characterStore = useCharacterStore();
      return characterStore.currentExperiencePoints > characterStore.maxExperiencePoints
        ? 'status-display--experience-over'
        : 'status-display--experience-ok';
    },
  },
  actions: {
    setLoading(flag) {
      this.isLoading = flag;
    },
    async refreshCloudCharacters(dataManager) {
      if (!dataManager) return;
      const temps = this.cloudCharacters.filter((c) => c.id.startsWith('temp-'));
      const serverList = await dataManager.loadCharacterListFromCloud();
      const serverIds = new Set(serverList.map((c) => c.id));

      // Keep local entries that still exist on server
      let merged = this.cloudCharacters.filter((c) => c.id.startsWith('temp-') || serverIds.has(c.id));

      // Add or update server entries
      serverList.forEach((srv) => {
        const idx = merged.findIndex((c) => c.id === srv.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...srv };
        } else {
          merged.push(srv);
        }
      });

      // Ensure temps remain
      temps.forEach((t) => {
        if (!merged.some((c) => c.id === t.id)) {
          merged.push(t);
        }
      });

      this.cloudCharacters = merged;
    },
    clearCloudCharacters() {
      this.cloudCharacters = [];
    },
    addCloudCharacter(ch) {
      this.cloudCharacters.push(ch);
    },
    updateCloudCharacter(id, updates) {
      const idx = this.cloudCharacters.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.cloudCharacters[idx] = {
          ...this.cloudCharacters[idx],
          ...updates,
        };
      }
    },
    removeCloudCharacter(id) {
      this.cloudCharacters = this.cloudCharacters.filter((c) => c.id !== id);
    },
    registerPendingCloudSave(id) {
      this.pendingCloudSaves[id] = { canceled: false };
      return this.pendingCloudSaves[id];
    },
    cancelPendingCloudSave(id) {
      if (this.pendingCloudSaves[id]) {
        this.pendingCloudSaves[id].canceled = true;
      }
    },
    completePendingCloudSave(id) {
      delete this.pendingCloudSaves[id];
    },
  },
});
