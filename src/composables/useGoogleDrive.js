import { ref, computed, onMounted } from 'vue';
import { GoogleDriveManager as RealGoogleDriveManager, DRIVE_FOLDER_NAME } from '../services/googleDriveManager.js';
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
  const canOverwrite = computed(() => Boolean(uiStore.currentDriveFileId));

  function ensureManager() {
    if (!googleDriveManager.value) {
      throw new Error('Google Drive manager is not initialized.');
    }
    return googleDriveManager.value;
  }

  async function handleSignInClick() {
    try {
      const manager = ensureManager();
      const signInPromise = new Promise((resolve, reject) => {
        manager.handleSignIn(async (error, authResult) => {
          if (error || !authResult || !authResult.signedIn) {
            uiStore.isSignedIn = false;
            reject(error || new Error('Ensure pop-ups are enabled.'));
          } else {
            uiStore.isSignedIn = true;
            await manager.ensureAppFolder();
            await uiStore.refreshDriveCharacters(manager);
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
    } catch (error) {
      showToast({ type: 'error', ...messages.googleDrive.signIn.error(error) });
      return Promise.reject(error);
    }
  }

  function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    googleDriveManager.value.handleSignOut(() => {
      uiStore.isSignedIn = false;
      uiStore.currentDriveFileId = null;
      uiStore.clearDriveCharacters();
      showToast({ type: 'success', ...messages.googleDrive.signOut.success() });
    });
  }

  async function saveFile() {
    if (!dataManager.googleDriveManager) return;
    uiStore.isCloudSaveSuccess = false;

    const savePromise = dataManager
      .saveDataToAppData(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        uiStore.currentDriveFileId,
      )
      .then(async (result) => {
        if (result && result.id) {
          uiStore.isCloudSaveSuccess = true;
          uiStore.currentDriveFileId = result.id;
          await uiStore.refreshDriveCharacters(dataManager.googleDriveManager);
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

  async function saveAsNewFile() {
    const previousId = uiStore.currentDriveFileId;
    uiStore.currentDriveFileId = null;
    try {
      await saveFile();
    } catch (error) {
      uiStore.currentDriveFileId = previousId;
      throw error;
    }
  }

  function overwriteFile() {
    if (!uiStore.currentDriveFileId) {
      return Promise.resolve();
    }
    return saveFile();
  }

  function pickDriveFile(folderId) {
    return new Promise((resolve, reject) => {
      ensureManager().showFilePicker(
        (error, file) => {
          if (error || !file) {
            reject(error || new Error('ファイルが選択されませんでした。'));
          } else {
            resolve(file);
          }
        },
        folderId,
        ['application/json'],
      );
    });
  }

  async function openDriveFile() {
    if (!dataManager.googleDriveManager) return;
    const folderId = await dataManager.googleDriveManager.ensureAppFolder();
    if (!folderId) {
      showToast({
        type: 'error',
        title: 'Google Drive',
        message: `${DRIVE_FOLDER_NAME} フォルダを準備できませんでした。`,
      });
      return;
    }

    const loadPromise = pickDriveFile(folderId).then(async (file) => {
      const parsedData = await dataManager.loadDataFromDrive(file.id);
      if (!parsedData) {
        throw new Error('ファイルの内容を読み込めませんでした。');
      }
      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
      uiStore.currentDriveFileId = file.id;
      await uiStore.refreshDriveCharacters(dataManager.googleDriveManager);
      return file;
    });

    showAsyncToast(loadPromise, {
      loading: messages.googleDrive.load.loading('キャラクター'),
      success: messages.googleDrive.load.success('キャラクター'),
      error: (err) => messages.googleDrive.load.error(err),
    });

    return loadPromise;
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
    canOverwrite,
    handleSignInClick,
    handleSignOutClick,
    openDriveFile,
    saveFile,
    saveAsNewFile,
    overwriteFile,
  };
}
