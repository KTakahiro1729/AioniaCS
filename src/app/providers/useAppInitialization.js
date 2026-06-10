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
  return new Promise((resolve, reject) => {
    let timerId;
    const cleanup = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Google API script failed to load.'));
    };
    timerId = setTimeout(() => {
      cleanup();
      reject(new Error('Google API script load timed out.'));
    }, 8000);
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
  });
}

export function useAppInitialization() {
  const uiStore = useUiStore();

  async function initialize() {
    const driveManager = initializeDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const usingMock = isUsingMockDrive();

    if (driveManager && typeof driveManager.onGapiLoad === 'function') {
      try {
        if (!usingMock) {
          await waitForGoogleScript();
        }
        await driveManager.onGapiLoad();
        uiStore.isGapiInitialized = true;
        const restored = await driveManager.restoreSession();
        uiStore.isSignedIn = restored;
      } catch (error) {
        console.error('Failed to initialize Drive manager:', error);
        if (usingMock) {
          uiStore.isGapiInitialized = true;
          uiStore.isSignedIn = true;
        } else {
          // モックDriveへの無言フォールバックは廃止。実際には保存されないのに
          // 「保存成功」と表示される事故を防ぐため、未接続のままにする。
          uiStore.isGapiInitialized = false;
          uiStore.isSignedIn = false;
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
