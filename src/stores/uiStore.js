import { defineStore } from "pinia";
import { AioniaGameData } from "../data/gameData.js";
import { useCharacterStore } from "./characterStore.js";

export const useUiStore = defineStore("ui", {
  state: () => ({
    outputButtonText: AioniaGameData.uiMessages.outputButton.default,
    helpState: "closed",
    isDesktop: false,
    isCloudSaveSuccess: false,
    isSignedIn: false,
    driveStatusMessage: "",
    isGapiInitialized: false,
    isGisInitialized: false,
    driveFolderId: null,
    driveFolderName: "",
    currentDriveFileId: null,
    currentDriveFileName: "",
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
    isHelpVisible(state) {
      return state.helpState !== "closed";
    },
  },
});
