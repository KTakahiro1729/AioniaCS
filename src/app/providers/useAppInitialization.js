import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/locales/ja.js';
import { buildSnapshotFromStore } from '@/features/character-sheet/utils/characterSnapshot.js';

function getSharedDriveId(location) {
  const params = new URLSearchParams(location.search);
  return params.get('sharedId');
}

function normalizeApiKey(rawKey) {
  if (typeof rawKey === 'string') {
    const trimmed = rawKey.trim();
    if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
      return null;
    }
    return trimmed;
  }

  if (!rawKey) {
    return null;
  }

  return rawKey;
}

function resolveDriveApiKey(dataManager) {
  const managerKey = normalizeApiKey(dataManager?.googleDriveManager?.apiKey);
  if (managerKey) {
    return managerKey;
  }

  const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  const envKey = normalizeApiKey(metaEnv?.VITE_GOOGLE_API_KEY);
  return envKey || null;
}

function buildDriveDownloadUrl(fileId, dataManager) {
  const apiKey = resolveDriveApiKey(dataManager);
  if (apiKey) {
    const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
    url.searchParams.set('alt', 'media');
    url.searchParams.set('key', apiKey);
    return url.toString();
  }

  const fallbackUrl = new URL('https://drive.usercontent.google.com/download');
  fallbackUrl.searchParams.set('id', fileId);
  fallbackUrl.searchParams.set('export', 'download');
  return fallbackUrl.toString();
}

function createSharedDataParser(dataManager) {
  return async function parseSharedPayload(buffer) {
    try {
      const rawJsonData = await deserializeCharacterPayload(buffer);
      return dataManager.parseLoadedData(rawJsonData);
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error('Failed to parse shared character data.');
      normalized.code = 'parseFailed';
      throw normalized;
    }
  };
}

function resolveSharedErrorKey(error) {
  if (error?.code === 'fetchFailed') {
    return 'fetchFailed';
  }
  if (error?.code === 'parseFailed') {
    return 'parseFailed';
  }
  return 'general';
}

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { logAndToastError } = useNotifications();

  const parseSharedPayload = dataManager && typeof dataManager.parseLoadedData === 'function' ? createSharedDataParser(dataManager) : null;

  async function loadSharedCharacter(fileId) {
    if (!fileId) {
      return false;
    }

    if (!parseSharedPayload) {
      console.error('DataManager is required to load shared characters.');
      return false;
    }

    try {
      const response = await fetch(buildDriveDownloadUrl(fileId, dataManager));
      if (!response.ok) {
        const error = new Error('Failed to fetch shared character data.');
        error.code = 'fetchFailed';
        throw error;
      }

      const buffer = await response.arrayBuffer();
      const parsedData = await parseSharedPayload(buffer);

      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);

      uiStore.clearCurrentDriveFileId();
      uiStore.isViewingShared = true;
      uiStore.setLastSavedSnapshot(buildSnapshotFromStore(characterStore));
      return true;
    } catch (error) {
      const key = resolveSharedErrorKey(error);
      logAndToastError(error, () => messages.share.loadError.toast(key), 'loadSharedCharacter');
      return false;
    }
  }

  async function initialize() {
    uiStore.setLoading(true);
    const sharedId = getSharedDriveId(window.location);
    const loaded = await loadSharedCharacter(sharedId);

    if (!loaded) {
      uiStore.isViewingShared = false;
    }

    uiStore.setLoading(false);
  }

  return { initialize };
}
