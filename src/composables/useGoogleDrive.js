import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useCharacterStore } from "../stores/characterStore.js";
import { useNotifications } from "./useNotifications.js";

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast } = useNotifications();

  function _checkDriveReadiness(actionContext = "operate") {
    if (!googleDriveManager.value) {
      showToast({
        type: "error",
        title: "Drive エラー",
        message: "Drive Manager is not available.",
      });
      return false;
    }
    if (!uiStore.isSignedIn && actionContext !== "sign in") {
      showToast({
        type: "error",
        title: "未サインイン",
        message: `Please sign in to ${actionContext}.`,
      });
      return false;
    }
    return true;
  }

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);
  const canOperateDrive = computed(() => uiStore.canOperateDrive);

  function handleSignInClick() {
    if (!googleDriveManager.value) {
      showToast({
        type: "error",
        title: "Drive エラー",
        message: "Manager not available.",
      });
      return;
    }
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Signing in...",
    });
    try {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          showToast({
            type: "error",
            title: "Sign-in failed",
            message:
              (error
                ? error.message || error.details
                : "Ensure pop-ups are enabled.") || "Please try again.",
          });
        } else {
          uiStore.isSignedIn = true;
          showToast({
            type: "success",
            title: "Signed in",
            message: `Folder: ${uiStore.driveFolderName || "Not selected"}`,
          });
          if (!uiStore.driveFolderId) {
            getOrPromptForDriveFolder();
          }
        }
      });
    } catch (err) {
      uiStore.isSignedIn = false;
      showToast({
        type: "error",
        title: "Sign-in error",
        message: err.message || "An unexpected error occurred.",
      });
    }
  }

  function handleSignOutClick() {
    if (!_checkDriveReadiness("sign out")) return;
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Signing out...",
    });
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.currentDriveFileId = null;
      uiStore.currentDriveFileName = "";
      showToast({ type: "success", title: "Signed out", message: "" });
    });
  }

  async function getOrPromptForDriveFolder() {
    if (!_checkDriveReadiness("set up a folder")) return;
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Accessing folder...",
    });
    const appFolderName = "AioniaCS_Data";
    try {
      const folderInfo =
        await googleDriveManager.value.getOrCreateAppFolder(appFolderName);
      if (folderInfo && folderInfo.id) {
        uiStore.driveFolderId = folderInfo.id;
        uiStore.driveFolderName = folderInfo.name;
        localStorage.setItem("aioniaDriveFolderId", folderInfo.id);
        localStorage.setItem("aioniaDriveFolderName", folderInfo.name);
        showToast({
          type: "success",
          title: "Folder ready",
          message: uiStore.driveFolderName,
        });
      } else {
        showToast({
          type: "warning",
          title: "Drive",
          message: "Choose a folder.",
        });
        await promptForDriveFolder(false);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Folder setup error",
        message: error.message || "Please choose manually.",
      });
      await promptForDriveFolder(false);
    }
  }

  function promptForDriveFolder() {
    if (!_checkDriveReadiness("select a folder")) return;
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Opening folder picker...",
    });
    googleDriveManager.value.showFolderPicker((error, folder) => {
      if (error) {
        showToast({
          type: "error",
          title: "Folder selection error",
          message: error.message || "Cancelled or failed.",
        });
      } else if (folder && folder.id) {
        uiStore.driveFolderId = folder.id;
        uiStore.driveFolderName = folder.name;
        localStorage.setItem("aioniaDriveFolderId", folder.id);
        localStorage.setItem("aioniaDriveFolderName", folder.name);
        showToast({
          type: "success",
          title: "Folder selected",
          message: uiStore.driveFolderName,
        });
        uiStore.currentDriveFileId = null;
        uiStore.currentDriveFileName = "";
      } else {
        if (!uiStore.driveFolderId) {
          showToast({
            type: "warning",
            title: "Folder selection cancelled",
            message: "",
          });
        }
      }
    });
  }

  async function handleSaveToDriveClick() {
    if (!_checkDriveReadiness("save")) return;
    if (!uiStore.driveFolderId) {
      showToast({
        type: "warning",
        title: "Drive",
        message: "Select folder first.",
      });
      await promptForDriveFolder(false);
      if (!uiStore.driveFolderId) {
        showToast({
          type: "error",
          title: "Save cancelled",
          message: "No folder selected.",
        });
        return;
      }
    }
    showToast({
      type: "info",
      title: "Google Drive",
      message: `Saving to "${uiStore.driveFolderName}"`,
    });
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
        showToast({ type: "success", title: "Saved", message: savedFile.name });
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
      showToast({
        type: "error",
        title: "Save error",
        message: error.message || "Unknown error",
      });
    }
  }

  async function handleLoadFromDriveClick() {
    if (!_checkDriveReadiness("load")) return;
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Opening file picker...",
    });
    googleDriveManager.value.showFilePicker(
      async (error, file) => {
        if (error) {
          showToast({
            type: "error",
            title: "File selection error",
            message: error.message || "Cancelled or failed.",
          });
          return;
        }
        if (!file || !file.id) {
          showToast({
            type: "warning",
            title: "File selection cancelled",
            message: "",
          });
          return;
        }
        showToast({
          type: "info",
          title: "Google Drive",
          message: `Loading ${file.name}...`,
        });
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
            showToast({
              type: "success",
              title: "Loaded",
              message: `${file.name} from Drive`,
            });
          } else {
            throw new Error("Load operation did not return data.");
          }
        } catch (err) {
          showToast({
            type: "error",
            title: "Load error",
            message: err.message || "Unknown error",
          });
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
      showToast({ type: "info", title: "Google API", message: "Loading..." });
      try {
        await googleDriveManager.value.onGapiLoad();
        showToast({ type: "success", title: "Google API Ready", message: "" });
      } catch (err) {
        showToast({
          type: "error",
          title: "Google API Error",
          message: "Initializing failed",
        });
        console.error("GAPI client init error:", err);
      }
    };

    const handleGisLoaded = async () => {
      if (uiStore.isGisInitialized || !googleDriveManager.value) return;
      uiStore.isGisInitialized = true;
      showToast({
        type: "info",
        title: "Google Sign-In",
        message: "Loading...",
      });
      try {
        await googleDriveManager.value.onGisLoad();
        showToast({
          type: "success",
          title: "Google Sign-In Ready",
          message: "",
        });
      } catch (err) {
        showToast({
          type: "error",
          title: "Google Sign-In Error",
          message: "Initializing failed",
        });
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
