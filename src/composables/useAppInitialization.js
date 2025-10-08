import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { deserializeCharacterPayload } from '../utils/characterSerialization.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

function getSharedDriveId(location) {
  const params = new URLSearchParams(location.search);
  return params.get('sharedId');
}

function buildDriveDownloadUrl(fileId) {
  const url = new URL('https://drive.google.com/uc');
  url.searchParams.set('export', 'download');
  url.searchParams.set('id', fileId);
  return url.toString();
}

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function loadSharedCharacter(fileId) {
    if (!fileId) {
      return false;
    }

    if (!dataManager || typeof dataManager.parseLoadedData !== 'function') {
      console.error('DataManager is required to load shared characters.');
      return false;
    }

    try {
      const response = await fetch(buildDriveDownloadUrl(fileId));
      if (!response.ok) {
        const error = new Error('Failed to fetch shared character data.');
        error.code = 'fetchFailed';
        throw error;
      }

      const buffer = await response.arrayBuffer();

      let rawJsonData;
      try {
        rawJsonData = await deserializeCharacterPayload(buffer);
      } catch (parseError) {
        parseError.code = 'parseFailed';
        throw parseError;
      }

      let parsedData;
      try {
        parsedData = dataManager.parseLoadedData(rawJsonData);
      } catch (parseError) {
        parseError.code = 'parseFailed';
        throw parseError;
      }

      Object.assign(characterStore.character, parsedData.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
      Object.assign(characterStore.equipments, parsedData.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);

      uiStore.clearCurrentDriveFileId();
      uiStore.isViewingShared = true;
      return true;
    } catch (error) {
      const key = error?.code === 'fetchFailed' ? 'fetchFailed' : error?.code === 'parseFailed' ? 'parseFailed' : 'general';
      showToast({ type: 'error', ...messages.share.loadError.toast(key) });
      console.error('Error loading shared character:', error);
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
