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

  async function refreshDriveCharacters() {
    if (!uiStore.isSignedIn || !dataManager.googleDriveManager) {
      return;
    }
    try {
      const list = await dataManager.loadCharacterListFromDrive();
      uiStore.driveCharacters = list;
    } catch (error) {
      console.error('Failed to refresh Drive character list:', error);
    }
  }

  function handleSignInClick() {
    if (!googleDriveManager.value) return;
    const signInPromise = new Promise((resolve, reject) => {
      googleDriveManager.value.handleSignIn(async (error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          reject(error || new Error('Ensure pop-ups are enabled.'));
        } else {
          uiStore.isSignedIn = true;
          try {
            await googleDriveManager.value.ensureAppFolder();
            await refreshDriveCharacters();
          } catch (folderError) {
            console.error('Failed to prepare Drive folder:', folderError);
          }
          resolve();
        }
      });
    });
    showAsyncToast(signInPromise, {
      loading: messages.googleDrive.signIn.loading(),
      success: messages.googleDrive.signIn.success(),
      error: (err) => messages.googleDrive.signIn.error(err),
    });
    return signInPromise;
  }

  function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.currentDriveFileId = null;
      uiStore.clearDriveCharacters();
      uiStore.isCloudSaveSuccess = false;
      showToast({ type: 'success', ...messages.googleDrive.signOut.success() });
    });
  }

  async function pickDriveFile() {
    const gdm = dataManager.googleDriveManager;
    if (!gdm) {
      throw new Error('Google Drive is not initialized.');
    }
    const folderId = await gdm.ensureAppFolder();
    if (!folderId) {
      throw new Error('Google Drive folder could not be accessed.');
    }
    return new Promise((resolve, reject) => {
      gdm.showFilePicker(
        (err, file) => {
          if (err || !file) {
            reject(err || new Error('Picker cancelled by user.'));
          } else {
            resolve(file);
          }
        },
        folderId,
        ['application/json'],
      );
    });
  }

  function applyLoadedCharacter(parsedData) {
    Object.assign(characterStore.character, parsedData.character);
    characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
    characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
    Object.assign(characterStore.equipments, parsedData.equipments);
    characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
  }

  async function openDriveFile() {
    let loadPromise = null;
    try {
      const file = await pickDriveFile();
      const displayName = file.name.replace(/\.json$/i, '');
      loadPromise = dataManager.loadDataFromDrive(file.id).then((parsedData) => {
        if (!parsedData) {
          throw new Error(messages.file.loadError);
        }
        applyLoadedCharacter(parsedData);
        uiStore.currentDriveFileId = file.id;
        uiStore.isCloudSaveSuccess = false;
        return displayName;
      });
      showAsyncToast(loadPromise, {
        loading: messages.googleDrive.load.loading(displayName),
        success: messages.googleDrive.load.success(displayName),
        error: (err) => messages.googleDrive.load.error(err),
      });
      await loadPromise;
      await refreshDriveCharacters();
    } catch (error) {
      if (error && error.message === 'Picker cancelled by user.') {
        return;
      }
      if (!loadPromise && error) {
        showToast({ type: 'error', ...messages.googleDrive.load.error(error) });
      }
    }
  }

  async function saveCharacterToDrive(fileId) {
    if (!dataManager.googleDriveManager) return null;
    uiStore.isCloudSaveSuccess = false;
    const targetFileId = fileId ?? uiStore.currentDriveFileId ?? null;
    const savePromise = dataManager
      .saveDataToDrive(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        targetFileId,
      )
      .then((result) => {
        if (result && result.id) {
          uiStore.currentDriveFileId = result.id;
          uiStore.isCloudSaveSuccess = true;
        }
        return result;
      });

    showAsyncToast(savePromise, {
      loading: messages.googleDrive.save.loading(),
      success: messages.googleDrive.save.success(),
      error: (err) => messages.googleDrive.save.error(err),
    });

    try {
      const result = await savePromise;
      await refreshDriveCharacters();
      return result;
    } catch (error) {
      throw error;
    }
  }

  function saveOrUpdateCurrentCharacterInDrive() {
    return saveCharacterToDrive(uiStore.currentDriveFileId);
  }

  function saveNewCharacterToDrive() {
    uiStore.currentDriveFileId = null;
    return saveCharacterToDrive(null);
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
    openDriveFile,
    saveCharacterToDrive,
    saveOrUpdateCurrentCharacterInDrive,
    saveNewCharacterToDrive,
    refreshDriveCharacters,
  };
}
