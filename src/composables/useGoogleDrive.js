import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";

// showCustomAlert removed from parameters
export function useGoogleDrive(allCharacterData, dataManager) {
  // リアクティブな状態
  const isSignedIn = ref(false);
  const driveFolderId = ref(
    localStorage.getItem("aioniaDriveFolderId") || null,
  );
  const driveFolderName = ref(
    localStorage.getItem("aioniaDriveFolderName") || "",
  );
  const currentDriveFileId = ref(null);
  // const currentDriveFileName = ref(""); // Removed unused variable
  const driveStatusMessage = ref("Initializing...");
  const isGapiInitialized = ref(false);
  const isGisInitialized = ref(false);
  const showDriveMenu = ref(false);
  const googleDriveManager = ref(null);

  // 算出プロパティ
  const canSignInToGoogle = computed(
    () =>
      isGapiInitialized.value && isGisInitialized.value && !isSignedIn.value,
  );
  const canOperateDrive = computed(
    () => isSignedIn.value && !!driveFolderId.value,
  );

  function _checkDriveReadiness(actionContext = "operate") {
    if (!googleDriveManager.value) {
      driveStatusMessage.value = "Error: Drive Manager is not available.";
      return false;
    }
    if (!isSignedIn.value) {
      driveStatusMessage.value = `Error: Please sign in to ${actionContext}.`;
      return false;
    }
    return true;
  }

  function handleSignInClick() {
    // ... (元のロジックをここに移動)
    googleDriveManager.value.handleSignIn((error, authResult) => {
      if (error || !authResult?.signedIn) {
        isSignedIn.value = false;
        driveStatusMessage.value = "Sign-in failed.";
      } else {
        isSignedIn.value = true;
        driveStatusMessage.value = `Signed in. Folder: ${driveFolderName.value || "Not selected"}`;
      }
    });
  }

  function handleSignOutClick() {
    /* ... */
  }
  function promptForDriveFolder() {
    /* ... */
  }
  async function handleSaveToDriveClick() {
    if (!_checkDriveReadiness("save")) return;
    driveStatusMessage.value = `Saving to "${driveFolderName.value}"...`;
    try {
      const savedFile = await dataManager.saveDataToDrive(/* ...引数... */);
      if (savedFile?.id) {
        currentDriveFileId.value = savedFile.id;
        // ...
      }
    } catch (e) {
      driveStatusMessage.value = `Save error: ${e.message}`;
    }
  }
  async function handleLoadFromDriveClick() {
    /* ... */
  }

  function initializeGoogleDrive() {
    const apiKey = "AIzaSyBXvh_XH2XdHedIO5AaZKWLl1NJm7UAHnU";
    const clientId =
      "913887099800-5pkljcl9uua4ktealpbndilam9i1q1dg.apps.googleusercontent.com";
    googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
    dataManager.setGoogleDriveManager(googleDriveManager.value);

    // gapi/gisのロード完了を監視し、初期化する
    // (index.htmlのコールバック関数からApp.vue経由で呼び出すか、
    //  またはscriptタグのロード状態をポーリングする)
  }

  onMounted(() => {
    initializeGoogleDrive();
    // Vueインスタンスをグローバルに公開して、index.htmlのコールバックからアクセスできるようにする
    window.vueApp = {
      handleGapiLoaded: () => {
        isGapiInitialized.value = true;
        googleDriveManager.value.onGapiLoad().catch((e) => console.error(e));
      },
      handleGisLoaded: () => {
        isGisInitialized.value = true;
        googleDriveManager.value.onGisLoad().catch((e) => console.error(e));
      },
    };
  });

  return {
    isSignedIn,
    driveStatusMessage,
    showDriveMenu,
    canSignInToGoogle,
    canOperateDrive,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    handleSaveToDriveClick,
    handleLoadFromDriveClick,
  };
}
