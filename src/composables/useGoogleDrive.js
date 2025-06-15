import { ref, computed, onMounted } from "vue";
import { GoogleDriveManager } from "../services/googleDriveManager.js";
import { useUiStore } from "../stores/uiStore.js";
import { useNotifications } from "./useNotifications.js";

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const googleDriveManager = ref(null);
  const { showToast } = useNotifications();

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);

  function handleSignInClick() {
    if (!googleDriveManager.value) return;
    showToast({
      type: "info",
      title: "Google Drive",
      message: "Signing in...",
    });
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
        uiStore.refreshDriveCharacters(googleDriveManager.value);
        showToast({ type: "success", title: "Signed in", message: "" });
      }
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

  return { canSignInToGoogle, handleSignInClick, handleSignOutClick };
}
