import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useCharacterStore } from "../stores/characterStore.js";
import { useNotifications } from "./useNotifications.js";
import { messages } from "../locales/ja.js";

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
      loading: messages.googleDrive.signIn.loading,
      success: messages.googleDrive.signIn.success,
      error: (err) => messages.googleDrive.signIn.error(err),
    });
  }

  function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.clearDriveCharacters();
      showToast({ type: "success", ...messages.googleDrive.signOut.success });
    });
  }

  function promptForDriveFolder() {
    const gdm = dataManager.googleDriveManager;
    if (!gdm) return;
    gdm.showFolderPicker((err, folder) => {
      if (err || !folder) {
        showToast({
          type: "error",
          ...messages.googleDrive.folderPicker.error(err),
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

    const charName = characterStore.character.name || fileName;
    const now = new Date().toISOString();

    if (!fileId) {
      const tempId = `temp-${Date.now()}`;
      uiStore.addDriveCharacter({
        id: tempId,
        name: fileName,
        characterName: charName,
        updatedAt: now,
      });

      const token = uiStore.registerPendingDriveSave(tempId);

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
        .then((result) => {
          if (!token.canceled && result) {
            uiStore.isCloudSaveSuccess = true;
            uiStore.updateDriveCharacter(tempId, {
              id: result.id,
              name: result.name,
              updatedAt: now,
            });
          }
          uiStore.completePendingDriveSave(tempId);
        })
        .catch((err) => {
          if (!token.canceled) {
            uiStore.removeDriveCharacter(tempId);
          }
          uiStore.completePendingDriveSave(tempId);
          throw err;
        });

      showAsyncToast(savePromise, {
        loading: messages.googleDrive.save.loading,
        success: messages.googleDrive.save.success,
        error: (err) => messages.googleDrive.save.error(err),
      });
      return savePromise;
    } else {
      const idx = uiStore.driveCharacters.findIndex((c) => c.id === fileId);
      const prev = idx !== -1 ? { ...uiStore.driveCharacters[idx] } : null;
      uiStore.updateDriveCharacter(fileId, {
        characterName: charName,
        updatedAt: now,
      });

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
        .then((result) => {
          if (result) {
            uiStore.isCloudSaveSuccess = true;
          }
        })
        .catch((err) => {
          if (prev) {
            uiStore.updateDriveCharacter(fileId, prev);
          }
          throw err;
        });

      showAsyncToast(savePromise, {
        loading: messages.googleDrive.save.loading,
        success: messages.googleDrive.save.success,
        error: (err) => messages.googleDrive.save.error(err),
      });
      return savePromise;
    }
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
        showToast({ type: "error", ...messages.googleDrive.apiInitError });
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
        showToast({ type: "error", ...messages.googleDrive.signInInitError });
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
