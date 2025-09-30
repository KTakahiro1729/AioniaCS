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
    async refreshDriveCharacters(dataManager) {
      if (!dataManager || !dataManager.googleDriveManager) return;
      const temps = this.driveCharacters.filter((c) => c.id.startsWith('temp-'));
      try {
        const serverList = await dataManager.loadCharacterListFromDrive();
        const merged = [...serverList];
        temps.forEach((temp) => {
          if (!merged.some((item) => item.id === temp.id)) {
            merged.push(temp);
          }
        });
        this.driveCharacters = merged;
      } catch (error) {
        console.error('Failed to refresh Drive characters:', error);
      }
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
