import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useCharacterStore } from "../stores/characterStore.js";
import { useNotifications } from "./useNotifications.js";

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast, showAsyncToast } = useNotifications();

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);

  function handleSignInClick() {
    if (!googleDriveManager.value) return;
    const signInPromise = new Promise((resolve, reject) => {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          reject(error || new Error("Ensure pop-ups are enabled."));
        } else {
          uiStore.isSignedIn = true;
          uiStore.refreshDriveCharacters(googleDriveManager.value);
          resolve();
        }
      });
    });
    showAsyncToast(signInPromise, {
      loading: { title: "Google Drive", message: "Signing in..." },
      success: { title: "Signed in", message: "" },
      error: (err) => ({
        title: "Sign-in failed",
        message: err.message || err.details || "Please try again.",
      }),
    });
  }

  function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.clearDriveCharacters();
      showToast({ type: "success", title: "Signed out", message: "" });
    });
  }

  function promptForDriveFolder() {
    const gdm = dataManager.googleDriveManager;
    if (!gdm) return;
    gdm.showFolderPicker((err, folder) => {
      if (err || !folder) {
        showToast({
          type: "error",
          title: "Drive",
          message: err?.message || "フォルダ選択をキャンセルしました",
        });
        return;
      }
      uiStore.driveFolderId = folder.id;
      uiStore.driveFolderName = folder.name;
    });
  }

  async function saveCharacterToDrive(fileId, fileName) {
    if (!dataManager.googleDriveManager) return;
    uiStore.isCloudSaveSuccess = false;
    const savePromise = dataManager
      .saveDataToAppData(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        fileId,
        fileName,
      )
      .then(async (result) => {
        if (result) {
          uiStore.currentDriveFileId = result.id;
          uiStore.currentDriveFileName = result.name;
          uiStore.isCloudSaveSuccess = true;
          await uiStore.refreshDriveCharacters(dataManager.googleDriveManager);
        }
      });

    showAsyncToast(savePromise, {
      loading: { title: "Google Drive", message: "Saving..." },
      success: { title: "Saved", message: "" },
      error: (err) => ({ title: "Save failed", message: err.message || "" }),
    });
  }

  function handleSaveToDriveClick() {
    return saveCharacterToDrive(
      uiStore.currentDriveFileId,
      uiStore.currentDriveFileName,
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
      console.info("Google API Loading...");
      try {
        await googleDriveManager.value.onGapiLoad();
        console.info("Google API Ready");
      } catch {
        showToast({
          type: "error",
          title: "Google API Error",
          message: "Initializing failed",
        });
      }
    };

    const handleGisLoaded = async () => {
      if (uiStore.isGisInitialized || !googleDriveManager.value) return;
      uiStore.isGisInitialized = true;
      console.info("Google Sign-In Loading...");
      try {
        await googleDriveManager.value.onGisLoad();
        console.info("Google Sign-In Ready");
      } catch {
        showToast({
          type: "error",
          title: "Google Sign-In Error",
          message: "Initializing failed",
        });
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

  onMounted(() => {
    if (window.GoogleDriveManager) {
      initializeGoogleDrive();
    }
  });

  return {
    canSignInToGoogle,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    saveCharacterToDrive,
    handleSaveToDriveClick,
  };
}
