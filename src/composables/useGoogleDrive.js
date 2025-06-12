import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useCharacterStore } from "../stores/characterStore.js";
import { DriveMessages } from "../data/driveMessages.js";
import { useNotifications } from "./useNotifications.js";

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast } = useNotifications();

  function _checkDriveReadiness(actionContext = "operate") {
    if (!googleDriveManager.value) {
      uiStore.driveStatusMessage = DriveMessages.errors.unknown(
        "Drive Manager not available.",
      );
      return false;
    }
    if (!uiStore.isSignedIn && actionContext !== "sign in") {
      uiStore.driveStatusMessage = DriveMessages.status.signInPrompt;
      return false;
    }
    return true;
  }

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);
  const canOperateDrive = computed(() => uiStore.canOperateDrive);

  function handleSignInClick() {
    if (!googleDriveManager.value) {
      uiStore.driveStatusMessage = DriveMessages.errors.unknown(
        "Drive Manager not available.",
      );
      return;
    }
    uiStore.driveStatusMessage = DriveMessages.status.signingIn;
    try {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          uiStore.driveStatusMessage = DriveMessages.errors.signInFailed;
          showToast({
            type: "error",
            message: DriveMessages.errors.signInFailed,
          });
        } else {
          uiStore.isSignedIn = true;
          uiStore.driveStatusMessage = DriveMessages.status.signedIn(
            uiStore.driveFolderName,
          );
          showToast({
            type: "success",
            message: DriveMessages.notifications.signInSuccess,
          });
          if (!uiStore.driveFolderId) {
            getOrPromptForDriveFolder();
          }
        }
      });
    } catch (err) {
      uiStore.isSignedIn = false;
      handleDriveError(err);
    }
  }

  function handleSignOutClick() {
    if (!_checkDriveReadiness("sign out")) return;
    uiStore.driveStatusMessage = DriveMessages.status.signInPrompt;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.currentDriveFileId = null;
      uiStore.currentDriveFileName = "";
      uiStore.driveStatusMessage = DriveMessages.status.signInPrompt;
      showToast({
        type: "success",
        message: DriveMessages.notifications.signOutSuccess,
      });
    });
  }

  async function getOrPromptForDriveFolder() {
    if (!_checkDriveReadiness("set up a folder")) return;
    uiStore.driveStatusMessage = DriveMessages.status.folderSetup;
    const appFolderName = "AioniaCS_Data";
    try {
      const folderInfo =
        await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        uiStore.driveFolderId = folderInfo.id;
        uiStore.driveFolderName = folderInfo.name;
        localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
        localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
        uiStore.driveStatusMessage = DriveMessages.status.signedIn(
          uiStore.driveFolderName,
        );
        showToast({
          type: "success",
          message: DriveMessages.notifications.folderSelected(
            uiStore.driveFolderName,
          ),
        });
      } else {
        uiStore.driveStatusMessage = DriveMessages.status.folderSelection;
        await promptForDriveFolder(false);
      }
    } catch (error) {
      handleDriveError(error);
      await promptForDriveFolder(false);
    }
  }

  function promptForDriveFolder() {
    if (!_checkDriveReadiness("select a folder")) return;
    uiStore.driveStatusMessage = DriveMessages.status.folderSelection;
    googleDriveManager.value.showFolderPicker((error, folder) => {
      if (error) {
        handleDriveError(error);
      } else if (folder && folder.id) {
        uiStore.driveFolderId = folder.id;
        uiStore.driveFolderName = folder.name;
        localStorage.setItem("aioniaDriveFolderId", folder.id);
        localStorage.setItem("aioniaDriveFolderName", folder.name);
        uiStore.driveStatusMessage = DriveMessages.status.signedIn(
          uiStore.driveFolderName,
        );
        showToast({
          type: "success",
          message: DriveMessages.notifications.folderSelected(
            uiStore.driveFolderName,
          ),
        });
        uiStore.currentDriveFileId = null;
        uiStore.currentDriveFileName = "";
      } else {
        uiStore.driveStatusMessage = uiStore.driveFolderId
          ? DriveMessages.status.signedIn(uiStore.driveFolderName)
          : DriveMessages.status.folderSelection;
      }
    });
  }

  async function handleSaveToDriveClick() {
    if (!_checkDriveReadiness("save")) return;
    if (!uiStore.driveFolderId) {
      uiStore.driveStatusMessage = DriveMessages.guidance.folderSelectNeeded;
      await promptForDriveFolder(false);
      if (!uiStore.driveFolderId) {
        uiStore.driveStatusMessage = DriveMessages.guidance.folderSelectNeeded;
        return;
      }
    }
    uiStore.driveStatusMessage = DriveMessages.status.saving(
      uiStore.driveFolderName,
    );
    const fileName =
      (characterStore.character.name || "Aionia_Character_Sheet").replace(
        /[\\/:*?"<>|]/g,
        "_",
      ) + ".json";
    try {
      const savedFile = await dataManager.saveDataToDrive(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        uiStore.driveFolderId,
        uiStore.currentDriveFileId,
        fileName,
      );
      if (savedFile && savedFile.id) {
        uiStore.currentDriveFileId = savedFile.id;
        uiStore.currentDriveFileName = savedFile.name;
        uiStore.driveStatusMessage = DriveMessages.status.signedIn(
          uiStore.driveFolderName,
        );
        showToast({
          type: "success",
          message: DriveMessages.notifications.saveSuccess(
            uiStore.currentDriveFileName,
          ),
        });
        uiStore.isCloudSaveSuccess = true;
        setTimeout(() => {
          uiStore.isCloudSaveSuccess = false;
        }, 2000);
      } else {
        throw new Error(
          "Save operation did not return expected file information.",
        );
      }
    } catch (error) {
      handleDriveError(error);
    }
  }

  async function handleLoadFromDriveClick() {
    if (!_checkDriveReadiness("load")) return;
    uiStore.driveStatusMessage = DriveMessages.status.folderSelection;
    googleDriveManager.value.showFilePicker(
      async (error, file) => {
        if (error) {
          handleDriveError(error);
          return;
        }
        if (!file || !file.id) {
          uiStore.driveStatusMessage = DriveMessages.status.folderSelection;
          return;
        }
        uiStore.driveStatusMessage = DriveMessages.status.loading(file.name);
        try {
          const parsedData = await dataManager.loadDataFromDrive(file.id);
          if (parsedData) {
            Object.assign(characterStore.character, parsedData.character);
            characterStore.skills.splice(
              0,
              characterStore.skills.length,
              ...parsedData.skills,
            );
            characterStore.specialSkills.splice(
              0,
              characterStore.specialSkills.length,
              ...parsedData.specialSkills,
            );
            Object.assign(characterStore.equipments, parsedData.equipments);
            characterStore.histories.splice(
              0,
              characterStore.histories.length,
              ...parsedData.histories,
            );
            uiStore.currentDriveFileId = file.id;
            uiStore.currentDriveFileName = file.name;
            uiStore.driveStatusMessage = DriveMessages.status.signedIn(
              uiStore.driveFolderName,
            );
            showToast({
              type: "success",
              message: DriveMessages.notifications.loadSuccess(
                uiStore.currentDriveFileName,
              ),
            });
          } else {
            throw new Error("Load operation did not return data.");
          }
        } catch (err) {
          handleDriveError(err);
        }
      },
      uiStore.driveFolderId || null,
      ["application/json"],
    );
  }

  function handleDriveError(error) {
    let message;
    if (error && error.status === 404) {
      message = DriveMessages.errors.folderNotFound;
    } else if (error && error.status === 403) {
      message = DriveMessages.errors.permissionDenied;
    } else if (error && /Network/i.test(error.message)) {
      message = DriveMessages.errors.network;
    } else if (error && error.message) {
      message = DriveMessages.errors.unknown(error.message);
    } else {
      message = DriveMessages.errors.unknown(error);
    }
    uiStore.driveStatusMessage = message;
    showToast({ type: "error", message });
  }

  function initializeGoogleDrive() {
    const apiKey = "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU";
    const clientId =
      "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com";
    googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
    dataManager.setGoogleDriveManager(googleDriveManager.value);

    const handleGapiLoaded = async () => {
      if (uiStore.isGapiInitialized || !googleDriveManager.value) return;
      uiStore.isGapiInitialized = true;
      uiStore.driveStatusMessage = DriveMessages.status.initializing;
      try {
        await googleDriveManager.value.onGapiLoad();
        uiStore.driveStatusMessage = DriveMessages.status.gapiReady;
      } catch (err) {
        handleDriveError(err);
      }
    };

    const handleGisLoaded = async () => {
      if (uiStore.isGisInitialized || !googleDriveManager.value) return;
      uiStore.isGisInitialized = true;
      uiStore.driveStatusMessage = DriveMessages.status.initializing;
      try {
        await googleDriveManager.value.onGisLoad();
        uiStore.driveStatusMessage = uiStore.isSignedIn
          ? DriveMessages.status.signedIn(uiStore.driveFolderName)
          : DriveMessages.status.gisReady;
      } catch (err) {
        handleDriveError(err);
      }
    };

    const gapiPoll = setInterval(() => {
      if (window.gapi && window.gapi.load) {
        handleGapiLoaded();
        clearInterval(gapiPoll);
      }
    }, 100);

    const gisPoll = setInterval(() => {
      if (window.google && window.google.accounts) {
        handleGisLoaded();
        clearInterval(gisPoll);
      }
    }, 100);

    const savedFolderId = localStorage.getItem("aioniaDriveFolderId");
    const savedFolderName = localStorage.getItem("aioniaDriveFolderName");
    if (savedFolderId) {
      uiStore.driveFolderId = savedFolderId;
      uiStore.driveFolderName = savedFolderName || "Previously Selected";
    }
  }

  onMounted(() => {
    if (window.GoogleDriveManager) {
      initializeGoogleDrive();
    }
  });

  return {
    canSignInToGoogle,
    canOperateDrive,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    handleSaveToDriveClick,
    handleLoadFromDriveClick,
  };
}
