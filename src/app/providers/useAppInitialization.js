import { initializeDriveManager, isUsingMockDrive } from '@/infrastructure/google-drive/index.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

function waitForGoogleScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.gapi && window.gapi.load) {
    return Promise.resolve();
  }
  if (typeof document === 'undefined') {
    return Promise.resolve();
  }
  const script = document.querySelector('script[src*="apis.google.com/js/api.js"]');
  if (!script) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const finalize = () => {
      script.removeEventListener('load', finalize);
      script.removeEventListener('error', finalize);
      resolve();
    };
    script.addEventListener('load', finalize);
    script.addEventListener('error', finalize);
  });
}

export function useAppInitialization() {
  const uiStore = useUiStore();

  async function initialize() {
    const driveManager = initializeDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const usingMock = isUsingMockDrive();

    if (!usingMock) {
      await waitForGoogleScript();
    }

    if (driveManager && typeof driveManager.onGapiLoad === 'function') {
      try {
        await driveManager.onGapiLoad();
        uiStore.isGapiInitialized = true;
        const restored = await driveManager.restoreSession();
        uiStore.isSignedIn = restored;
        if (restored && typeof driveManager.loadConfig === 'function') {
          const config = await driveManager.loadConfig();
          if (config?.characterFolderPath) {
            uiStore.setDriveFolderPath(config.characterFolderPath);
          }
        }
      } catch (error) {
        console.error('Failed to initialize Drive manager:', error);
        if (usingMock) {
          uiStore.isGapiInitialized = true;
          uiStore.isSignedIn = true;
        }
      }
    } else if (usingMock) {
      uiStore.isGapiInitialized = true;
      uiStore.isSignedIn = true;
    }

    uiStore.setLoading(false);
  }

  return { initialize };
}
