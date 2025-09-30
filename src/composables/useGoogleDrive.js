import { ref, computed, onMounted } from 'vue';
import { GoogleDriveManager as RealGoogleDriveManager } from '../services/googleDriveManager.js';
import { MockGoogleDriveManager } from '../services/mockGoogleDriveManager.js';
import { useUiStore } from '../stores/uiStore.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

const useMock = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
const GoogleDriveManager = useMock ? MockGoogleDriveManager : RealGoogleDriveManager;

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast, showAsyncToast } = useNotifications();

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);

  function handleSignInClick() {
    if (!googleDriveManager.value) return;
    const signInPromise = new Promise((resolve, reject) => {
      googleDriveManager.value.handleSignIn(async (error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          reject(error || new Error('Ensure pop-ups are enabled.'));
        } else {
          try {
            uiStore.isSignedIn = true;
            const folder = await googleDriveManager.value.ensureWorkspaceFolder();
            if (!folder) {
              throw new Error('Failed to access Google Drive workspace folder.');
            }
            uiStore.setDriveFolder(folder);
            const list = await dataManager.loadCharacterListFromDrive();
            uiStore.driveCharacters = list;
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });
    });
    showAsyncToast(signInPromise, {
      loading: messages.googleDrive.signIn.loading(),
      success: messages.googleDrive.signIn.success(),
      error: (err) => messages.googleDrive.signIn.error(err),
    });
  }

  function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.setDriveFolder(null);
      uiStore.clearDriveCharacters();
      googleDriveManager.value.clearWorkspaceFolder?.();
      showToast({ type: 'success', ...messages.googleDrive.signOut.success() });
    });
  }

  function promptForDriveFolder() {
    const gdm = dataManager.googleDriveManager;
    if (!gdm) return;
    let resultPromise = null;
    gdm.showFolderPicker((err, folder) => {
      if (err || !folder) {
        showToast({
          type: 'error',
          ...messages.googleDrive.folderPicker.error(err),
        });
        return;
      }
      const loadPromise = (async () => {
        gdm.setWorkspaceFolder(folder);
        uiStore.setDriveFolder(folder);
        const list = await dataManager.loadCharacterListFromDrive();
        uiStore.driveCharacters = list;
      })();
      showAsyncToast(loadPromise, {
        loading: messages.googleDrive.folderPicker.loading(),
        success: messages.googleDrive.folderPicker.success(folder.name),
        error: (loadErr) => messages.googleDrive.folderPicker.error(loadErr),
      });
      resultPromise = loadPromise;
    });
    return resultPromise;
  }

  async function saveCharacterToDrive(fileId) {
    if (!dataManager.googleDriveManager) return;
    uiStore.isCloudSaveSuccess = false;

    if (!uiStore.driveFolderId) {
      const error = new Error('Google Drive folder is not selected.');
      showToast({ type: 'error', ...messages.googleDrive.workspaceNotSelected() });
      return Promise.reject(error);
    }

    const charName = characterStore.character.name || '名もなき冒険者';
    const now = new Date().toISOString();

    if (!fileId) {
      const tempId = `temp-${Date.now()}`;
      uiStore.addDriveCharacter({
        id: tempId,
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
        )
        .then((result) => {
          if (!token.canceled && result) {
            uiStore.isCloudSaveSuccess = true;
            uiStore.updateDriveCharacter(tempId, {
              id: result.id,
              updatedAt: now,
            });
            uiStore.currentDriveFileId = result.id;
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
        loading: messages.googleDrive.save.loading(),
        success: messages.googleDrive.save.success(),
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
        loading: messages.googleDrive.save.loading(),
        success: messages.googleDrive.save.success(),
        error: (err) => messages.googleDrive.save.error(err),
      });
      return savePromise;
    }
  }

  function handleSaveToDriveClick() {
    return saveCharacterToDrive(uiStore.currentDriveFileId);
  }

  function saveOrUpdateCurrentCharacterInDrive() {
    return saveCharacterToDrive(uiStore.currentDriveFileId);
  }

  function initializeGoogleDrive() {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    googleDriveManager.value = new GoogleDriveManager(apiKey, clientId);
    dataManager.setGoogleDriveManager(googleDriveManager.value);

    const handleGapiLoaded = async () => {
      if (uiStore.isGapiInitialized || !googleDriveManager.value) return;
      uiStore.isGapiInitialized = true;
      console.info('Google API Loading...');
      try {
        await googleDriveManager.value.onGapiLoad();
        console.info('Google API Ready');
      } catch {
        showToast({ type: 'error', ...messages.googleDrive.apiInitError() });
      }
    };

    const handleGisLoaded = async () => {
      if (uiStore.isGisInitialized || !googleDriveManager.value) return;
      uiStore.isGisInitialized = true;
      console.info('Google Sign-In Loading...');
      try {
        await googleDriveManager.value.onGisLoad();
        console.info('Google Sign-In Ready');
      } catch {
        showToast({ type: 'error', ...messages.googleDrive.signInInitError() });
      }
    };

    function waitForScript(selector, check) {
      return new Promise((resolve, reject) => {
        if (check()) {
          resolve();
          return;
        }
        const script = document.querySelector(selector);
        if (!script) {
          reject(new Error('Script not found'));
          return;
        }
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', () => reject(new Error('Script load failed')), { once: true });
      });
    }

    waitForScript('script[src="https://apis.google.com/js/api.js"]', () => window.gapi && window.gapi.load)
      .then(handleGapiLoaded)
      .catch(() => showToast({ type: 'error', ...messages.googleDrive.apiInitError() }));

    waitForScript('script[src="https://accounts.google.com/gsi/client"]', () => window.google && window.google.accounts)
      .then(handleGisLoaded)
      .catch(() => showToast({ type: 'error', ...messages.googleDrive.signInInitError() }));
  }

  onMounted(() => {
    if (window.GoogleDriveManager || window.MockGoogleDriveManager) {
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
    saveOrUpdateCurrentCharacterInDrive,
  };
}
