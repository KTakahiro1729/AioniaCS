import { ref, computed, onMounted } from 'vue';
import { GoogleDriveManager as RealGoogleDriveManager } from '../services/googleDriveManager.js';
import { MockGoogleDriveManager } from '../services/mockGoogleDriveManager.js';
import { useUiStore } from '../stores/uiStore.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { useModal } from './useModal.js';
import { messages } from '../locales/ja.js';

const useMock = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
const GoogleDriveManager = useMock ? MockGoogleDriveManager : RealGoogleDriveManager;

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast, showAsyncToast } = useNotifications();
  const { showModal } = useModal();

  const canSignInToGoogle = computed(() => uiStore.canSignInToGoogle);

  function handleSignInClick() {
    if (!googleDriveManager.value) return;
    const signInPromise = new Promise((resolve, reject) => {
      googleDriveManager.value.handleSignIn((error, authResult) => {
        if (error || !authResult || !authResult.signedIn) {
          uiStore.isSignedIn = false;
          reject(error || new Error('Ensure pop-ups are enabled.'));
        } else {
          uiStore.isSignedIn = true;
          resolve();
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
      uiStore.clearCurrentDriveFileId();
      showToast({ type: 'success', ...messages.googleDrive.signOut.success() });
    });
  }

  function promptForDriveFolder() {
    const gdm = dataManager.googleDriveManager;
    if (!gdm) return;
    gdm.showFolderPicker((err, folder) => {
      if (err || !folder) {
        showToast({
          type: 'error',
          ...messages.googleDrive.folderPicker.error(err),
        });
        return;
      }
      uiStore.driveFolderId = folder.id;
      uiStore.driveFolderName = folder.name;
    });
  }

  async function loadCharacterFromDrive() {
    if (!dataManager.googleDriveManager) return null;

    return new Promise((resolve) => {
      dataManager.googleDriveManager.showFilePicker(
        (err, file) => {
          if (err || !file) {
            showToast({ type: 'error', ...messages.googleDrive.load.error(err || new Error('No file selected')) });
            resolve(null);
            return;
          }

          const loadPromise = dataManager.loadDataFromDrive(file.id).then((parsedData) => {
            if (!parsedData) {
              throw new Error('Failed to load character data.');
            }
            Object.assign(characterStore.character, parsedData.character);
            characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
            characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
            Object.assign(characterStore.equipments, parsedData.equipments);
            characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
            uiStore.setCurrentDriveFileId(file.id);
            return parsedData;
          });

          showAsyncToast(loadPromise, {
            loading: messages.googleDrive.load.loading(file.name),
            success: messages.googleDrive.load.success(file.name),
            error: (loadErr) => messages.googleDrive.load.error(loadErr),
          });

          loadPromise.then((result) => resolve(result)).catch(() => resolve(null));
        },
        null,
        ['application/json'],
      );
    });
  }

  async function saveCharacterToDrive(option = false) {
    if (!dataManager.googleDriveManager) return;
    uiStore.isCloudSaveSuccess = false;

    let isNewFile = false;
    let explicitFileId = null;

    if (typeof option === 'boolean') {
      isNewFile = option;
    } else if (typeof option === 'string') {
      explicitFileId = option;
    } else if (option === null) {
      isNewFile = true;
    }

    const charName = characterStore.character.name || '名もなき冒険者';
    let targetFileId = explicitFileId;

    if (!targetFileId && !isNewFile && uiStore.currentDriveFileId) {
      targetFileId = uiStore.currentDriveFileId;
    }

    if (!targetFileId) {
      const existing = await dataManager.findDriveFileByCharacterName(charName);
      if (existing) {
        const result = await showModal(messages.googleDrive.overwriteConfirm(existing.name));
        if (!result || result.value !== 'overwrite') {
          return null;
        }
        targetFileId = existing.id;
      }
    }

    const savePromise = dataManager
      .saveDataToAppData(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        targetFileId,
      )
      .then((result) => {
        if (result) {
          uiStore.isCloudSaveSuccess = true;
          uiStore.setCurrentDriveFileId(result.id);
        }
        return result;
      });

    showAsyncToast(savePromise, {
      loading: messages.googleDrive.save.loading(),
      success: messages.googleDrive.save.success(),
      error: (err) => messages.googleDrive.save.error(err),
    });

    return savePromise;
  }

  function handleSaveToDriveClick() {
    return saveCharacterToDrive(false);
  }

  function saveOrUpdateCurrentCharacterInDrive() {
    return saveCharacterToDrive(false);
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
    loadCharacterFromDrive,
    saveCharacterToDrive,
    handleSaveToDriveClick,
    saveOrUpdateCurrentCharacterInDrive,
  };
}
