import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { AioniaGameData } from "../../data/gameData.js";
import { DataManager } from "../../services/dataManager.js";
import { GoogleDriveManager } from "../../services/googleDriveManager.js";

export function useDriveManagement(
  character,
  skills,
  specialSkills,
  equipments,
  histories,
  toggleButton,
  menuEl,
) {
  const dataManager = ref(null);
  const googleDriveManager = ref(null);

  const showDriveMenu = ref(false);
  const driveStatusMessage = ref("");
  const isSignedIn = ref(false);
  const googleUser = ref(null);
  const driveFolderId = ref(null);
  const driveFolderName = ref("");
  const currentDriveFileId = ref(null);
  const currentDriveFileName = ref("");
  const isGapiInitialized = ref(false);
  const isGisInitialized = ref(false);
  const isCloudSaveSuccess = ref(false);

  const canSignInToGoogle = ref(false);

  const canOperateDrive = ref(false);

  const toggleDriveMenu = () => {
    showDriveMenu.value = !showDriveMenu.value;
  };

  const _checkDriveReadiness = (action = "operate") => {
    if (!googleDriveManager.value) {
      driveStatusMessage.value = "Error: Drive Manager is not available.";
      return false;
    }
    if (!isSignedIn.value && action !== "sign in") {
      driveStatusMessage.value = `Error: Please sign in to ${action}.`;
      return false;
    }
    return true;
  };

  const handleSignInClick = () => {
    showDriveMenu.value = false;
    if (!googleDriveManager.value) return;
    driveStatusMessage.value = "Signing in... Please wait.";
    googleDriveManager.value.handleSignIn((error, authResult) => {
      if (error || !authResult || !authResult.signedIn) {
        isSignedIn.value = false;
        googleUser.value = null;
        driveStatusMessage.value = "Sign-in failed.";
      } else {
        isSignedIn.value = true;
        googleUser.value = { displayName: "User" };
        driveStatusMessage.value = `Signed in. Folder: ${driveFolderName.value || "Not selected"}`;
        if (!driveFolderId.value) getOrPromptForDriveFolder();
      }
    });
  };

  const handleSignOutClick = () => {
    showDriveMenu.value = false;
    if (!_checkDriveReadiness("sign out")) return;
    driveStatusMessage.value = "Signing out...";
    googleDriveManager.value.handleSignOut(() => {
      isSignedIn.value = false;
      googleUser.value = null;
      currentDriveFileId.value = null;
      currentDriveFileName.value = "";
      driveStatusMessage.value = "Signed out.";
    });
  };

  const getOrPromptForDriveFolder = async () => {
    showDriveMenu.value = false;
    if (!_checkDriveReadiness("set up a folder")) return;
    driveStatusMessage.value = "Accessing Google Drive folder...";
    const appFolderName = "AioniaCS_Data";
    try {
      const folderInfo =
        await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        driveFolderId.value = folderInfo.id;
        driveFolderName.value = folderInfo.name;
        localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
        localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
        driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
      } else {
        driveStatusMessage.value = "Could not auto-setup Drive folder.";
        await promptForDriveFolder(false);
      }
    } catch (error) {
      driveStatusMessage.value = "Folder setup error.";
      await promptForDriveFolder(false);
    }
  };

  const promptForDriveFolder = async (isDirectClick = true) => {
    if (isDirectClick) showDriveMenu.value = false;
    if (!_checkDriveReadiness("select a folder")) return;
    driveStatusMessage.value = "Opening Google Drive folder picker...";
    googleDriveManager.value.showFolderPicker((error, folder) => {
      if (error) {
        driveStatusMessage.value = "Folder selection error.";
      } else if (folder && folder.id) {
        driveFolderId.value = folder.id;
        driveFolderName.value = folder.name;
        localStorage.setItem("aioniaDriveFolderId", folder.id);
        localStorage.setItem("aioniaDriveFolderName", folder.name);
        driveStatusMessage.value = `Drive Folder: ${driveFolderName.value}`;
        currentDriveFileId.value = null;
        currentDriveFileName.value = "";
      } else {
        driveStatusMessage.value = driveFolderId.value
          ? `Drive Folder: ${driveFolderName.value}`
          : "Folder selection cancelled.";
      }
    });
  };

  const handleSaveToDriveClick = async () => {
    if (!_checkDriveReadiness("save")) return;
    if (!driveFolderId.value) {
      driveStatusMessage.value = "Drive folder not set.";
      await promptForDriveFolder(false);
      if (!driveFolderId.value) {
        driveStatusMessage.value = "Save cancelled: No Drive folder selected.";
        return;
      }
    }
    driveStatusMessage.value = `Saving to "${driveFolderName.value}"...`;
    const fileName =
      (character.name || "Aionia_Character_Sheet").replace(
        /[\\/:*?"<>|]/g,
        "_",
      ) + ".json";
    try {
      const savedFile = await dataManager.value.saveDataToDrive(
        character,
        skills,
        specialSkills,
        equipments,
        histories,
        driveFolderId.value,
        currentDriveFileId.value,
        fileName,
      );
      if (savedFile && savedFile.id) {
        currentDriveFileId.value = savedFile.id;
        currentDriveFileName.value = savedFile.name;
        driveStatusMessage.value = `Saved: ${currentDriveFileName.value}`;
        isCloudSaveSuccess.value = true;
        setTimeout(() => {
          isCloudSaveSuccess.value = false;
        }, 2000);
      } else {
        throw new Error("Save operation did not return expected info.");
      }
    } catch (error) {
      driveStatusMessage.value = `Save error: ${error.message || "Unknown error"}`;
    }
  };

  const handleLoadFromDriveClick = async () => {
    if (!_checkDriveReadiness("load")) return;
    driveStatusMessage.value = "Opening Google Drive file picker...";
    googleDriveManager.value.showFilePicker(
      async (error, file) => {
        if (error) {
          driveStatusMessage.value = "File selection error.";
          return;
        }
        if (!file || !file.id) {
          driveStatusMessage.value = "File selection cancelled.";
          return;
        }
        driveStatusMessage.value = `Loading ${file.name}...`;
        try {
          const parsedData = await dataManager.value.loadDataFromDrive(file.id);
          if (parsedData) {
            Object.assign(character, parsedData.character);
            skills.splice(0, skills.length, ...parsedData.skills);
            specialSkills.splice(
              0,
              specialSkills.length,
              ...parsedData.specialSkills,
            );
            Object.assign(equipments, parsedData.equipments);
            histories.splice(0, histories.length, ...parsedData.histories);
            currentDriveFileId.value = file.id;
            currentDriveFileName.value = file.name;
            driveStatusMessage.value = `Loaded: ${currentDriveFileName.value}`;
          }
        } catch (err) {
          driveStatusMessage.value = `Load error: ${err.message || "Unknown error"}`;
        }
      },
      driveFolderId.value || null,
      ["application/json"],
    );
  };

  watch(showDriveMenu, (newValue) => {
    let listener;
    if (listener) {
      document.removeEventListener("click", listener, true);
      listener = null;
    }
    if (newValue) {
      nextTick(() => {
        const menu = menuEl.value;
        const toggle = toggleButton.value;
        if (menu && toggle) {
          listener = (event) => {
            if (
              !menu.contains(event.target) &&
              !toggle.contains(event.target)
            ) {
              showDriveMenu.value = false;
            }
          };
          document.addEventListener("click", listener, true);
        }
      });
    }
  });

  onMounted(() => {
    dataManager.value = new DataManager(AioniaGameData);
    if (window.GoogleDriveManager) {
      const apiKey = "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU";
      const clientId =
        "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com";
      googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
      dataManager.value.setGoogleDriveManager(googleDriveManager.value);

      const handleGapiLoaded = async () => {
        if (isGapiInitialized.value) return;
        isGapiInitialized.value = true;
        driveStatusMessage.value = "Google API Client: Loading...";
        try {
          await googleDriveManager.value.onGapiLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || "Not selected"}`
            : "Google API Client: Ready. Please sign in.";
          canSignInToGoogle.value = !isSignedIn.value;
        } catch (err) {
          driveStatusMessage.value = "Google API Client: Error initializing.";
        }
      };

      const handleGisLoaded = async () => {
        if (isGisInitialized.value) return;
        isGisInitialized.value = true;
        driveStatusMessage.value = "Google Sign-In: Loading...";
        try {
          await googleDriveManager.value.onGisLoad();
          driveStatusMessage.value = isSignedIn.value
            ? `Signed in. Folder: ${driveFolderName.value || "Not selected"}`
            : "Google Sign-In: Ready. Please sign in.";
          canSignInToGoogle.value = !isSignedIn.value;
        } catch (err) {
          driveStatusMessage.value = "Google Sign-In: Error initializing.";
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
    }

    const savedFolderId = localStorage.getItem("aioniaDriveFolderId");
    const savedFolderName = localStorage.getItem("aioniaDriveFolderName");
    if (savedFolderId) {
      driveFolderId.value = savedFolderId;
      driveFolderName.value = savedFolderName || "Previously Selected";
    }
    canOperateDrive.value = isSignedIn.value && driveFolderId.value;
  });

  onBeforeUnmount(() => {
    // no-op for now
  });

  return {
    dataManager,
    googleDriveManager,
    showDriveMenu,
    driveStatusMessage,
    isSignedIn,
    googleUser,
    driveFolderId,
    driveFolderName,
    currentDriveFileId,
    currentDriveFileName,
    isGapiInitialized,
    isGisInitialized,
    isCloudSaveSuccess,
    canSignInToGoogle,
    canOperateDrive,
    toggleDriveMenu,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    getOrPromptForDriveFolder,
    handleSaveToDriveClick,
    handleLoadFromDriveClick,
  };
}
