import { defineStore } from 'pinia';
import { useCharacterStore } from './characterStore.js';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isCloudSaveSuccess: false,
    isSignedIn: false,
    isGapiInitialized: false,
    isGisInitialized: false,
    isLoading: false,
    driveFolderId: null,
    driveFolderName: '',
    currentDriveFileId: null,
    currentDriveFileName: '',
    isViewingShared: false,
    driveCharacters: [],
    pendingDriveSaves: {},
    showHeader: true,
  }),
  getters: {
    experienceStatusClass() {
      const characterStore = useCharacterStore();
      return characterStore.currentExperiencePoints > characterStore.maxExperiencePoints
        ? 'status-display--experience-over'
        : 'status-display--experience-ok';
    },
    canSignInToGoogle(state) {
      return state.isGapiInitialized && state.isGisInitialized && !state.isSignedIn;
    },
    canOperateDrive(state) {
      return state.isSignedIn && state.driveFolderId;
    },
  },
  actions: {
    setLoading(flag) {
      this.isLoading = flag;
    },
    async refreshDriveCharacters(gdm) {
      if (!gdm) return;
      const temps = this.driveCharacters.filter((c) => c.id.startsWith('temp-'));
      const serverList = await gdm.listCharacters();
      const serverIds = new Set(serverList.map((c) => c.fileId));

      // Keep local entries that still exist on server
      let merged = this.driveCharacters.filter((c) => c.id.startsWith('temp-') || serverIds.has(c.id));

      // Add or update server entries
      serverList.forEach((srv) => {
        const idx = merged.findIndex((c) => c.id === srv.fileId);
        const data = { id: srv.fileId, characterName: srv.characterName, updatedAt: srv.lastModified };
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...data };
        } else {
          merged.push(data);
        }
      });

      // Ensure temps remain
      temps.forEach((t) => {
        if (!merged.some((c) => c.id === t.id)) {
          merged.push(t);
        }
      });

      this.driveCharacters = merged;
    },
    clearDriveCharacters() {
      this.driveCharacters = [];
    },
    addDriveCharacter(ch) {
      this.driveCharacters.push(ch);
    },
    updateDriveCharacter(id, updates) {
      const idx = this.driveCharacters.findIndex((c) => c.id === id);
      if (idx !== -1) {
        this.driveCharacters[idx] = {
          ...this.driveCharacters[idx],
          ...updates,
        };
      }
    },
    removeDriveCharacter(id) {
      this.driveCharacters = this.driveCharacters.filter((c) => c.id !== id);
    },
    registerPendingDriveSave(id) {
      this.pendingDriveSaves[id] = { canceled: false };
      return this.pendingDriveSaves[id];
    },
    cancelPendingDriveSave(id) {
      if (this.pendingDriveSaves[id]) {
        this.pendingDriveSaves[id].canceled = true;
      }
    },
    completePendingDriveSave(id) {
      delete this.pendingDriveSaves[id];
    },
  },
});
