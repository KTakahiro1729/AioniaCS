import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useCharacterStore } from "../stores/characterStore.js";

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);

  function _checkDriveReadiness(actionContext = "operate") {
    if (!googleDriveManager.value) {
      uiStore.driveStatusMessage = "Error: Drive Manager is not available.";
      return false;
    }
    if (!uiStore.isSignedIn && actionContext !== "sign in") {
      uiStore.driveStatusMessage = `Error: Please sign in to ${actionContext}.`;
      return false;
    }
    return true;
  }

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);
  const canOperateDrive = computed(() => uiStore.canOperateDrive);

  function handleSignInClick() {
    if (!googleDriveManager.value) {
      uiStore.driveStatusMessage = "Error: Drive Manager not available.";
      return;
    }
    uiStore.driveStatusMessage = "Signing in... Please wait.";
    try {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          uiStore.driveStatusMessage =
            "Sign-in failed. " +
            (error
              ? error.message || error.details || "Please try again."
              : "Ensure pop-ups are enabled.");
        } else {
          uiStore.isSignedIn = true;
          uiStore.driveStatusMessage = `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`;
          if (!uiStore.driveFolderId) {
            getOrPromptForDriveFolder();
          }
        }
      });
    } catch (err) {
      uiStore.isSignedIn = false;
      uiStore.driveStatusMessage =
        "Sign-in error: " + (err.message || "An unexpected error occurred.");
    }
  }

  function handleSignOutClick() {
    if (!_checkDriveReadiness("sign out")) return;
    uiStore.driveStatusMessage = "Signing out...";
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.currentDriveFileId = null;
      uiStore.currentDriveFileName = "";
      uiStore.driveStatusMessage = "Signed out.";
    });
  }

  async function getOrPromptForDriveFolder() {
    if (!_checkDriveReadiness("set up a folder")) return;
    uiStore.driveStatusMessage = "Accessing Google Drive folder...";
    const appFolderName = "AioniaCS_Data";
    try {
      const folderInfo =
        await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        uiStore.driveFolderId = folderInfo.id;
        uiStore.driveFolderName = folderInfo.name;
        localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
        localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
        uiStore.driveStatusMessage = `Drive Folder: ${uiStore.driveFolderName}`;
      } else {
        uiStore.driveStatusMessage =
          "Could not auto-setup Drive folder. Please choose one.";
        await promptForDriveFolder(false);
      }
    } catch (error) {
      uiStore.driveStatusMessage = `Folder setup error: ${error.message || "Please choose manually."}`;
      await promptForDriveFolder(false);
    }
  }

  function promptForDriveFolder() {
    if (!_checkDriveReadiness("select a folder")) return;
    uiStore.driveStatusMessage = "Opening Google Drive folder picker...";
    googleDriveManager.value.showFolderPicker((error, folder) => {
      if (error) {
        uiStore.driveStatusMessage = `Folder selection error: ${error.message || "Cancelled or failed."}`;
      } else if (folder && folder.id) {
        uiStore.driveFolderId = folder.id;
        uiStore.driveFolderName = folder.name;
        localStorage.setItem("aioniaDriveFolderId", folder.id);
        localStorage.setItem("aioniaDriveFolderName", folder.name);
        uiStore.driveStatusMessage = `Drive Folder: ${uiStore.driveFolderName}`;
        uiStore.currentDriveFileId = null;
        uiStore.currentDriveFileName = "";
      } else {
        uiStore.driveStatusMessage = uiStore.driveFolderId
          ? `Drive Folder: ${uiStore.driveFolderName}`
          : "Folder selection cancelled.";
      }
    });
  }

  async function handleSaveToDriveClick() {
    if (!_checkDriveReadiness("save")) return;
    if (!uiStore.driveFolderId) {
      uiStore.driveStatusMessage =
        "Drive folder not set. Please choose a folder first.";
      await promptForDriveFolder(false);
      if (!uiStore.driveFolderId) {
        uiStore.driveStatusMessage =
          "Save cancelled: No Drive folder selected.";
        return;
      }
    }
    uiStore.driveStatusMessage = `Saving to "${uiStore.driveFolderName}"...`;
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
        uiStore.driveStatusMessage = `Saved: ${uiStore.currentDriveFileName} to "${uiStore.driveFolderName}".`;
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
      uiStore.driveStatusMessage = `Save error: ${error.message || "Unknown error"}`;
    }
  }

  async function handleLoadFromDriveClick() {
    if (!_checkDriveReadiness("load")) return;
    uiStore.driveStatusMessage = "Opening Google Drive file picker...";
    googleDriveManager.value.showFilePicker(
      async (error, file) => {
        if (error) {
          uiStore.driveStatusMessage = `File selection error: ${error.message || "Cancelled or failed."}`;
          return;
        }
        if (!file || !file.id) {
          uiStore.driveStatusMessage =
            "File selection cancelled or no file chosen.";
          return;
        }
        uiStore.driveStatusMessage = `Loading ${file.name} from Drive...`;
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
            uiStore.driveStatusMessage = `Loaded: ${uiStore.currentDriveFileName} from Drive.`;
          } else {
            throw new Error("Load operation did not return data.");
          }
        } catch (err) {
          uiStore.driveStatusMessage = `Load error for ${file.name || "file"}: ${err.message || "Unknown error"}`;
        }
      },
      uiStore.driveFolderId || null,
      ["application/json"],
    );
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
      uiStore.driveStatusMessage = "Google API Client: Loading...";
      try {
        await googleDriveManager.value.onGapiLoad();
        uiStore.driveStatusMessage = uiStore.isSignedIn
          ? `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`
          : "Google API Client: Ready. Please sign in.";
      } catch (err) {
        uiStore.driveStatusMessage = "Google API Client: Error initializing.";
        console.error("GAPI client init error:", err);
      }
    };

    const handleGisLoaded = async () => {
      if (uiStore.isGisInitialized || !googleDriveManager.value) return;
      uiStore.isGisInitialized = true;
      uiStore.driveStatusMessage = "Google Sign-In: Loading...";
      try {
        await googleDriveManager.value.onGisLoad();
        uiStore.driveStatusMessage = uiStore.isSignedIn
          ? `Signed in. Folder: ${uiStore.driveFolderName || "Not selected"}`
          : "Google Sign-In: Ready. Please sign in.";
      } catch (err) {
        uiStore.driveStatusMessage = "Google Sign-In: Error initializing.";
        console.error("GIS client init error:", err);
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
