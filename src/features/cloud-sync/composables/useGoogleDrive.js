import { ref, computed, onMounted, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
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
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const { showToast, showAsyncToast } = useNotifications();
  const { showModal } = useModal();
  const { isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

  const googleDriveManager = ref(null);

  const canSignInToGoogle = computed(() => !isAuthenticated.value && !isLoading.value);
  const isDriveReady = computed(() => isAuthenticated.value && !!googleDriveManager.value);

  function syncGoogleDriveManager() {
    try {
      googleDriveManager.value = getDriveManagerInstance();
    } catch {
      googleDriveManager.value = initializeDriveManager();
    }

    if (googleDriveManager.value && typeof dataManager.setGoogleDriveManager === 'function') {
      dataManager.setGoogleDriveManager(googleDriveManager.value);
    }

    if (googleDriveManager.value?.setAccessTokenProvider) {
      googleDriveManager.value.setAccessTokenProvider(async () => {
        if (!isAuthenticated.value) {
          throw new Error('User is not authenticated');
        }
        return getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_API_AUDIENCE,
            scope: DRIVE_SCOPE,
          },
        });
      });
    }
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
    const desired = path ?? uiStore.driveFolderPath;
    const manager = googleDriveManager.value;
    const normalizedDesired = typeof manager.normalizeFolderPath === 'function' ? manager.normalizeFolderPath(desired) : desired;
    if (normalizedDesired === uiStore.driveFolderPath) {
      await manager.findOrCreateConfiguredCharacterFolder();
      return normalizedDesired;
    }
    try {
      const normalized = await manager.setCharacterFolderPath(desired);
      uiStore.setDriveFolderPath(normalized);
      await manager.findOrCreateConfiguredCharacterFolder();
      showToast({ type: 'success', ...messages.googleDrive.config.updateSuccess() });
      return normalized;
    } catch (error) {
      console.error('Failed to update Drive folder config:', error);
      showToast({ type: 'error', ...messages.googleDrive.config.updateError(error) });
      return uiStore.driveFolderPath;
    }
  }

  async function promptForDriveFolder() {
    if (!uiStore.isSignedIn) {
      showToast({ type: 'error', ...messages.googleDrive.config.requiresSignIn() });
      return uiStore.driveFolderPath;
    }
    const input = window.prompt('Google Driveの保存先フォルダパスを入力してください', uiStore.driveFolderPath);
    if (input === null) {
      return uiStore.driveFolderPath;
    }
    return updateDriveFolderPath(input);
  }

  async function loadCharacterFromDrive() {
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }
    if (!dataManager.googleDriveManager) {
      return null;
    }

    try {
      const folderId = await dataManager.googleDriveManager.findOrCreateConfiguredCharacterFolder();
      if (!folderId) {
        throw new Error('保存先フォルダが見つかりません');
      }
      const files = await dataManager.googleDriveManager.listFiles(folderId, ['application/zip', 'application/json']);
      if (!files.length) {
        throw new Error('保存済みのキャラクターが見つかりません');
      }

      let targetFile = null;
      if (files.length === 1) {
        targetFile = files[0];
      } else {
        const choices = files.map((file, index) => `${index + 1}: ${file.name}`).join('\n');
        const selection = window.prompt(`読み込むファイルを選んでください:\n${choices}`, '1');
        const index = Number.parseInt(selection, 10) - 1;
        if (Number.isInteger(index) && index >= 0 && index < files.length) {
          targetFile = files[index];
        }
      }

      if (!targetFile) {
        showToast({ type: 'error', ...messages.googleDrive.load.error(new Error('ファイルの選択がキャンセルされました')) });
        return null;
      }

      const loadPromise = dataManager.loadDataFromDrive(targetFile.id).then((parsedData) => {
        if (!parsedData) {
          throw new Error('キャラクターデータの読み込みに失敗しました');
        }
        Object.assign(characterStore.character, parsedData.character);
        characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
        characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
        Object.assign(characterStore.equipments, parsedData.equipments);
        characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
        uiStore.setCurrentDriveFileId(targetFile.id);
        return parsedData;
      });

      showAsyncToast(loadPromise, {
        loading: messages.googleDrive.load.loading(targetFile.name),
        success: messages.googleDrive.load.success(targetFile.name),
        error: (err) => messages.googleDrive.load.error(err),
      });

      return loadPromise.catch(() => null);
    } catch (error) {
      console.error('Failed to load character from Drive:', error);
      showToast({ type: 'error', ...messages.googleDrive.load.error(error) });
      return null;
    }
  }

  async function saveCharacterToDrive(option = false) {
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }
    if (!dataManager.googleDriveManager) {
      return null;
    }
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

  function handleSignInClick() {
    return loginWithRedirect();
  }

  function handleSignOutClick() {
    logout({ logoutParams: { returnTo: window.location.origin } });
    uiStore.isSignedIn = false;
    uiStore.clearCurrentDriveFileId();
  }

  function handleSaveToDriveClick() {
    return saveCharacterToDrive(false);
  }

  function saveOrUpdateCurrentCharacterInDrive() {
    return saveCharacterToDrive(false);
  }

  onMounted(() => {
    syncGoogleDriveManager();
  });

  watch(
    () => isLoading.value,
    (loading) => {
      uiStore.isLoading = loading;
    },
    { immediate: true },
  );

  watch(
    () => isAuthenticated.value,
    async (signedIn) => {
      uiStore.isSignedIn = signedIn;
      if (signedIn) {
        syncGoogleDriveManager();
        await refreshDriveFolderPath();
      } else {
        uiStore.clearCurrentDriveFileId();
      }
    },
    { immediate: true },
  );

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
