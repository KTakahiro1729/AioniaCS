import { defineStore } from "pinia";
import { useCharacterStore } from "./characterStore.js";

export const useUiStore = defineStore("ui", {
  state: () => ({
    isCloudSaveSuccess: false,
    isSignedIn: false,
    isGapiInitialized: false,
    isGisInitialized: false,
    driveFolderId: null,
    driveFolderName: "",
    currentDriveFileId: null,
    currentDriveFileName: "",
    isViewingShared: false,
    isHubVisible: false,
    driveCharacters: [],
  }),
  getters: {
    experienceStatusClass() {
      const characterStore = useCharacterStore();
      return characterStore.currentExperiencePoints >
        characterStore.maxExperiencePoints
        ? "status-display--experience-over"
        : "status-display--experience-ok";
    },
    canSignInToGoogle(state) {
      return (
        state.isGapiInitialized && state.isGisInitialized && !state.isSignedIn
      );
    },
    canOperateDrive(state) {
      return state.isSignedIn && state.driveFolderId;
    },
  },
  actions: {
    async refreshDriveCharacters(gdm) {
      if (!gdm) return;
      this.driveCharacters = await gdm.readIndexFile();
    },
    clearDriveCharacters() {
      this.driveCharacters = [];
    },
    openHub() {
      this.isHubVisible = true;
    },
    closeHub() {
      this.isHubVisible = false;
    },
  },
});
