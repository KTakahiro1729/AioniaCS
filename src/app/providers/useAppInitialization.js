import { initializeDriveManager, isUsingMockDrive } from '@/infrastructure/google-drive/index.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

export function useAppInitialization() {
  const uiStore = useUiStore();

  async function initialize() {
    const driveManager = initializeDriveManager(import.meta.env.VITE_GOOGLE_API_KEY, import.meta.env.VITE_GOOGLE_CLIENT_ID);

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
        if (isUsingMockDrive()) {
          uiStore.isGapiInitialized = true;
          uiStore.isSignedIn = true;
        }
      }
    } else if (isUsingMockDrive()) {
      uiStore.isGapiInitialized = true;
      uiStore.isSignedIn = true;
    }

    uiStore.setLoading(false);
  }

  return { initialize };
}
