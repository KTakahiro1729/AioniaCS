import { defineStore } from 'pinia';
import { useCharacterStore } from './characterStore.js';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isCloudSaveSuccess: false,
    isSignedIn: false,
    isGapiInitialized: false,
    isGisInitialized: false,
    isLoading: false,
    driveFolderPath: '慈悲なきアイオニア',
    currentDriveFileId: null,
    isViewingShared: false,
    pendingDriveSaves: {},
    showHeader: true,
    showSpecialSkillDescriptions: false,
    showItemDescriptions: false,
    dynamicShareMetadata: null,
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
      return state.isSignedIn;
    },
  },
  actions: {
    setLoading(flag) {
      this.isLoading = flag;
    },
    setCurrentDriveFileId(id) {
      this.currentDriveFileId = id;
    },
    clearCurrentDriveFileId() {
      this.currentDriveFileId = null;
    },
    setDynamicShareMetadata(metadata) {
      this.dynamicShareMetadata = metadata
        ? {
            pointerFileId: metadata.pointerFileId,
            key: metadata.key,
            salt: metadata.salt ?? null,
            shareLink: metadata.shareLink,
            includeFull: Boolean(metadata.includeFull),
            password: metadata.password ?? null,
          }
        : null;
    },
    clearDynamicShareMetadata() {
      this.dynamicShareMetadata = null;
    },
    setDriveFolderPath(path) {
      this.driveFolderPath = path;
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
