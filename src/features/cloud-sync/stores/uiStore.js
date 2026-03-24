import { defineStore } from 'pinia';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';

export const useUiStore = defineStore('ui', {
  state: () => ({
    isSignedIn: false,
    isGapiInitialized: false,
    isLoading: false,
    currentDriveFileId: null,
    prefetchedDriveData: {},
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
    setPrefetchedDriveData(id, data) {
      if (!id || data == null) return;
      this.prefetchedDriveData = { ...this.prefetchedDriveData, [id]: data };
    },
    consumePrefetchedDriveData(id) {
      if (!id || !this.prefetchedDriveData[id]) return null;
      const data = this.prefetchedDriveData[id];
      const rest = { ...this.prefetchedDriveData };
      delete rest[id];
      this.prefetchedDriveData = rest;
      return data;
    },
    clearCurrentDriveFileId() {
      this.currentDriveFileId = null;
    },
    setLastSavedSnapshot(snapshot) {
      this.lastSavedSnapshot = snapshot || null;
    },
  },
});
