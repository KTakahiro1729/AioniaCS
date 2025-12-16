import { defineStore } from 'pinia';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isSignedIn: false,
    isGapiInitialized: false,
    isLoading: false,
    driveFolderPath: '慈悲なきアイオニア',
    currentDriveFileId: null,
    isViewingShared: false,
    showSpecialSkillDescriptions: false,
    showItemDescriptions: false,
    lastSavedSnapshot: null,
  }),
  getters: {
    experienceStatusClass() {
      const characterStore = useCharacterStore();
      return characterStore.currentExperiencePoints > characterStore.maxExperiencePoints
        ? 'status-display--experience-over'
        : 'status-display--experience-ok';
    },
    canSignInToGoogle(state) {
      return !state.isSignedIn;
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
    setDriveFolderPath(path) {
      this.driveFolderPath = path;
    },
    setLastSavedSnapshot(snapshot) {
      this.lastSavedSnapshot = snapshot || null;
    },
  },
});
