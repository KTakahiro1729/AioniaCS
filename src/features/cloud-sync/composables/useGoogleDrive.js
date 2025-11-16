import { computed } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { jwtDecode } from 'jwt-decode';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import { messages } from '@/locales/ja.js';
import { initializeGoogleDriveManager, getGoogleDriveManagerInstance } from '@/infrastructure/google-drive/googleDriveManager.js';
import {
  initializeMockGoogleDriveManager,
  getMockGoogleDriveManagerInstance,
} from '@/infrastructure/google-drive/mockGoogleDriveManager.js';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';

function resolveDriveManager() {
  if (useMockDrive) {
    try {
      return getMockGoogleDriveManagerInstance();
    } catch {
      return initializeMockGoogleDriveManager('mock', 'mock');
    }
  }

  try {
    return getGoogleDriveManagerInstance();
  } catch {
    return initializeGoogleDriveManager();
  }
}

export function useGoogleDrive(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const { showToast, showAsyncToast } = useNotifications();
  const { showModal } = useModal();
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const googleDriveManager = resolveDriveManager();

  if (dataManager && typeof dataManager.setGoogleDriveManager === 'function') {
    dataManager.setGoogleDriveManager(googleDriveManager);
  }

  uiStore.isGapiInitialized = true;
  uiStore.isGisInitialized = true;

  const isDriveReady = computed(() => {
    if (useMockDrive) {
      return true;
    }
    return isAuthenticated.value && !isLoading.value;
  });

  async function resolveAccessToken() {
    if (useMockDrive) {
      return 'mock-access-token';
    }

    if (!isAuthenticated.value) {
      const err = messages.googleDrive.config.requiresSignIn();
      throw new Error(err.message);
    }

    try {
      const authorizationParams = {};
      const audience = import.meta.env.VITE_AUTH0_API_AUDIENCE;
      const scope = import.meta.env.VITE_AUTH0_DRIVE;
      if (audience) {
        authorizationParams.audience = audience;
      }
      if (scope) {
        authorizationParams.scope = scope;
      }

      const tokenResult = await getAccessTokenSilently({
        ...(Object.keys(authorizationParams).length > 0 ? { authorizationParams } : {}),
        detailedResponse: true,
      });

      console.log('[Debug] resolveAccessToken: getAccessTokenSilently から応答がありました。', tokenResult);

      console.log('[Debug] resolveAccessToken: access_token をデコードして Google トークンを抽出します...');

      if (!tokenResult.access_token) {
        console.error('[Debug] resolveAccessToken: 応答に access_token がありません。');
        throw new Error('access_token の取得に失敗しました');
      }

      const decodedAccessToken = jwtDecode(tokenResult.access_token);

      const googleTokenClaim = 'https://example.com/google_access_token';
      const googleAccessToken = decodedAccessToken[googleTokenClaim];

      if (!googleAccessToken) {
        console.error(`[Debug] resolveAccessToken: access_token に ${googleTokenClaim} が見つかりません。`, decodedAccessToken);
        throw new Error('Google Access Token が access_token 内に見つかりませんでした');
      }

      console.log(
        `[Debug] resolveAccessToken: Google Access Token の抽出に成功しました (Value): ${String(googleAccessToken).substring(0, 20)}...`,
      );
      return googleAccessToken;
    } catch (error) {
      if (error?.error === 'login_required' || error?.error === 'consent_required') {
        const err = messages.googleDrive.config.requiresSignIn();
        throw new Error(err.message);
      }
      throw new Error(error?.message || 'アクセストークンの取得に失敗しました');
    }
  }

  async function promptForDriveFolder() {
    if (!googleDriveManager || typeof googleDriveManager.showFolderPicker !== 'function') {
      showToast({ type: 'error', ...messages.googleDrive.folderPicker.error(new Error('Picker unavailable')) });
      return uiStore.driveFolderPath;
    }

    try {
      const accessToken = await resolveAccessToken();
      const folder = await googleDriveManager.showFolderPicker(accessToken);

      const targetPath = folder.path || folder.name;
      const normalized = await updateDriveFolderPath(targetPath);
      return normalized;
    } catch (error) {
      if (error.message.includes('Picker cancelled')) {
      } else {
        showToast({ type: 'error', ...messages.googleDrive.folderPicker.error(error) });
      }
      return uiStore.driveFolderPath;
    }
  }

  async function refreshDriveFolderPath() {
    if (!googleDriveManager) {
      return;
    }
    try {
      const accessToken = await resolveAccessToken();
      const config = await googleDriveManager.loadConfig(accessToken);
      const normalized = googleDriveManager.normalizeFolderPath(config?.characterFolderPath);
      uiStore.setDriveFolderPath(normalized);
    } catch (error) {
      console.error('Failed to load Drive folder config:', error);
      showToast({ type: 'error', ...messages.googleDrive.config.loadError() });
    }
  }

  async function updateDriveFolderPath(desiredPath) {
    if (!googleDriveManager) {
      return uiStore.driveFolderPath;
    }
    if (!useMockDrive && !isAuthenticated.value) {
      showToast({ type: 'error', ...messages.googleDrive.config.requiresSignIn() });
      return uiStore.driveFolderPath;
    }

    try {
      const accessToken = await resolveAccessToken();
      const normalized = await googleDriveManager.setCharacterFolderPath(accessToken, desiredPath);
      uiStore.setDriveFolderPath(normalized);
      showToast({ type: 'success', ...messages.googleDrive.config.updateSuccess() });
      return normalized;
    } catch (error) {
      console.error('Failed to update Drive folder config:', error);
      showToast({ type: 'error', ...messages.googleDrive.config.updateError(error) });
      return uiStore.driveFolderPath;
    }
  }

  async function loadCharacterFromDrive() {
    if (!googleDriveManager) {
      return null;
    }
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }

    let accessToken;
    try {
      accessToken = await resolveAccessToken();
    } catch (error) {
      showToast({ type: 'error', ...messages.googleDrive.load.error(error) });
      return null;
    }

    try {
      if (!googleDriveManager || typeof googleDriveManager.showFilePicker !== 'function') {
        throw new Error('File Picker is not available.');
      }

      const folderId = await googleDriveManager.ensureConfiguredFolder(accessToken);
      const file = await googleDriveManager.showFilePicker(accessToken, folderId, ['application/json', 'application/zip']);

      const loadPromise = dataManager.loadDataFromDrive(file.id, { accessToken }).then((parsedData) => {
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

      return await loadPromise;
    } catch (error) {
      if (error.message.includes('Picker cancelled')) {
      } else {
        console.log;
        showToast({ type: 'error', ...messages.googleDrive.load.error(error) });
      }
      return null;
    }
  }

  async function saveCharacterToDrive(option = false) {
    if (!googleDriveManager) {
      return null;
    }
    if (!isDriveReady.value) {
      showToast({ type: 'error', ...messages.googleDrive.initPending() });
      return null;
    }

    let accessToken;
    try {
      accessToken = await resolveAccessToken();
    } catch (error) {
      showToast({ type: 'error', ...messages.googleDrive.save.error(error) });
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
      try {
        const existing = await dataManager.findDriveFileByCharacterName(charName, { accessToken });
        if (existing) {
          const result = await showModal(messages.googleDrive.overwriteConfirm(existing.name));
          if (!result || result.value !== 'overwrite') {
            return null;
          }
          targetFileId = existing.id;
        }
      } catch (error) {
        showToast({ type: 'error', ...messages.googleDrive.save.error(error) });
        return null;
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
        { accessToken },
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

  return {
    isDriveReady,
    promptForDriveFolder,
    refreshDriveFolderPath,
    updateDriveFolderPath,
    loadCharacterFromDrive,
    saveCharacterToDrive,
    handleSaveToDriveClick,
    saveOrUpdateCurrentCharacterInDrive,
  };
}
