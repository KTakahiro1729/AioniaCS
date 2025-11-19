import { ref, computed, onMounted } from 'vue';
import { getGoogleDriveManagerInstance, initializeGoogleDriveManager } from '@/infrastructure/google-drive/googleDriveManager.js';
import {
  getMockGoogleDriveManagerInstance,
  initializeMockGoogleDriveManager,
} from '@/infrastructure/google-drive/mockGoogleDriveManager.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import { messages } from '@/locales/ja.js';

const useMock = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';
const getDriveManagerInstance = useMock ? getMockGoogleDriveManagerInstance : getGoogleDriveManagerInstance;
const initializeDriveManager = useMock ? initializeMockGoogleDriveManager : initializeGoogleDriveManager;

let scriptsWatched = false;

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const googleDriveManager = ref(null);
  const { showToast, showAsyncToast } = useNotifications();
  const { showModal } = useModal();

  const canSignInToGoogle = computed(() => !uiStore.isSignedIn);
  const isDriveReady = computed(() => uiStore.isGapiInitialized && uiStore.isSignedIn);

  function syncGoogleDriveManager() {
    try {
      googleDriveManager.value = getDriveManagerInstance();
    } catch {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      googleDriveManager.value = initializeDriveManager(apiKey, clientId);
    }

    if (googleDriveManager.value && typeof dataManager.setGoogleDriveManager === 'function') {
      dataManager.setGoogleDriveManager(googleDriveManager.value);
    }

    if (googleDriveManager.value && uiStore.isSignedIn) {
      refreshDriveFolderPath();
    }
  }

  async function handleSignInClick() {
    if (!googleDriveManager.value) return;

    // サインイン処理の完了を待つ
    const success = await googleDriveManager.value.handleSignIn();

    if (success) {
      // 成功したら状態を更新して設定を再読み込み
      uiStore.isSignedIn = true;
      await refreshDriveFolderPath();
      showToast({ type: 'success', message: 'Googleドライブに接続しました' });
    } else {
      // 必要であればエラー時のToastなどを追加
      // console.error('Sign in failed or cancelled');
    }
  }

  async function handleSignOutClick() {
    if (!googleDriveManager.value) return;
    await googleDriveManager.value.handleSignOut();
    uiStore.isSignedIn = false;
    uiStore.clearCurrentDriveFileId();
    showToast({ type: 'success', ...messages.googleDrive.signOut.success() });
  }

  async function promptForDriveFolder() {
    if (!uiStore.isSignedIn) {
      showToast({ type: 'error', ...messages.googleDrive.config.requiresSignIn() });
      return uiStore.driveFolderPath;
    }
    const gdm = dataManager.googleDriveManager;
    if (!gdm || typeof gdm.showFolderPicker !== 'function') {
      showToast({ type: 'error', ...messages.googleDrive.folderPicker.error(new Error('Picker unavailable')) });
      return uiStore.driveFolderPath;
    }

    return new Promise((resolve) => {
      gdm.showFolderPicker(async (err, folder) => {
        if (err || !folder) {
          showToast({
            type: 'error',
            ...messages.googleDrive.folderPicker.error(err),
          });
          resolve(uiStore.driveFolderPath);
          return;
        }
        const targetPath = folder.path || folder.name;
        const normalized = await updateDriveFolderPath(targetPath);
        resolve(normalized);
      });
    });
  }

  async function refreshDriveFolderPath() {
    if (!googleDriveManager.value || !uiStore.isSignedIn) {
      return;
    }
    try {
      const config = await googleDriveManager.value.loadConfig();
      if (config?.characterFolderPath) {
        uiStore.setDriveFolderPath(config.characterFolderPath);
      }
    } catch (error) {
      console.error('Failed to load Drive folder config:', error);
      showToast({ type: 'error', ...messages.googleDrive.config.loadError() });
    }
  }

  async function updateDriveFolderPath(path) {
    if (!googleDriveManager.value) {
      return uiStore.driveFolderPath;
    }
    if (!uiStore.isSignedIn) {
      showToast({ type: 'error', ...messages.googleDrive.config.requiresSignIn() });
      return uiStore.driveFolderPath;
    }
    const normalizer =
      typeof googleDriveManager.value.normalizeFolderPath === 'function' ? googleDriveManager.value.normalizeFolderPath(path) : path;

    if (normalizer === uiStore.driveFolderPath) {
      if (typeof googleDriveManager.value.findOrCreateConfiguredCharacterFolder === 'function') {
        await googleDriveManager.value.findOrCreateConfiguredCharacterFolder();
      }
      return normalizer;
    }

    try {
      const normalized = await googleDriveManager.value.setCharacterFolderPath(path);
      uiStore.setDriveFolderPath(normalized);
      if (typeof googleDriveManager.value.findOrCreateConfiguredCharacterFolder === 'function') {
        await googleDriveManager.value.findOrCreateConfiguredCharacterFolder();
      }
      showToast({ type: 'success', ...messages.googleDrive.config.updateSuccess() });
      return normalized;
    } catch (error) {
      console.error('Failed to update Drive folder config:', error);
      showToast({ type: 'error', ...messages.googleDrive.config.updateError(error) });
      return uiStore.driveFolderPath;
    }
  }

  async function loadCharacterFromDrive() {
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }
    if (!dataManager.googleDriveManager) return null;

    const folderId = await dataManager.googleDriveManager.findOrCreateConfiguredCharacterFolder();

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
        folderId,
        ['application/json', 'application/zip'],
      );
    });
  }

  async function saveCharacterToDrive(option = false) {
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }
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
      .saveCharacterToDrive(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        targetFileId,
      )
      .then(async (result) => {
        if (result) {
          uiStore.isCloudSaveSuccess = true;
          uiStore.setCurrentDriveFileId(result.id);
          return renameDriveFileIfNeeded(result);
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

  async function renameDriveFileIfNeeded(result) {
    const driveManager = dataManager.googleDriveManager;
    if (
      !result?.id ||
      !driveManager ||
      typeof driveManager.renameFile !== 'function' ||
      typeof dataManager.getDriveFileName !== 'function'
    ) {
      return result;
    }

    const desiredName = dataManager.getDriveFileName(characterStore.character.name);
    if (!desiredName || result.name === desiredName) {
      return result;
    }

    const renamed = await driveManager.renameFile(result.id, desiredName);
    return renamed || result;
  }

  function handleSaveToDriveClick() {
    return saveCharacterToDrive(false);
  }

  function saveOrUpdateCurrentCharacterInDrive() {
    return saveCharacterToDrive(false);
  }

  function initializeGoogleDrive() {
    syncGoogleDriveManager();

    if (!googleDriveManager.value || scriptsWatched) {
      return;
    }

    scriptsWatched = true;

    const handleGapiLoaded = async () => {
      if (uiStore.isGapiInitialized || !googleDriveManager.value) return;
      console.info('Google API Loading...');
      try {
        await googleDriveManager.value.onGapiLoad();
        console.info('Google API Ready');
        uiStore.isGapiInitialized = true;
        const restored = await googleDriveManager.value.restoreSession();
        uiStore.isSignedIn = restored;
        if (restored) {
          refreshDriveFolderPath();
        }
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
        uiStore.isGapiInitialized = false;
        uiStore.isSignedIn = false;
        showToast({ type: 'error', ...messages.googleDrive.apiInitError() });
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
  }

  syncGoogleDriveManager();

  onMounted(() => {
    initializeGoogleDrive();
  });

  return {
    canSignInToGoogle,
    isDriveReady,
    handleSignInClick,
    handleSignOutClick,
    promptForDriveFolder,
    refreshDriveFolderPath,
    updateDriveFolderPath,
    loadCharacterFromDrive,
    saveCharacterToDrive,
    handleSaveToDriveClick,
    saveOrUpdateCurrentCharacterInDrive,
  };
}
