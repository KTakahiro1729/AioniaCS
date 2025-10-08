import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

function parseDriveShareRoute(location) {
  const hash = location.hash || '';
  const match = hash.match(/^#\/share\/drive\/([^/?#]+)/i);
  if (!match) {
    return null;
  }
  try {
    return { fileId: decodeURIComponent(match[1]) };
  } catch (error) {
    console.error('Failed to decode shared file ID:', error);
    return null;
  }
}

function createShareError(key) {
  const message = messages.share.loadError[key] || messages.share.loadError.general;
  const error = new Error(message);
  error.shareErrorKey = key;
  return error;
}

function normalizeDriveContent(content) {
  if (content == null) {
    return null;
  }
  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(content));
  }
  if (ArrayBuffer.isView(content)) {
    return new TextDecoder().decode(content);
  }
  try {
    return JSON.stringify(content);
  } catch (error) {
    console.error('Failed to normalize Drive file content:', error);
    return null;
  }
}

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function initialize() {
    uiStore.setLoading(true);
    const params = parseDriveShareRoute(window.location);
    if (!params) {
      uiStore.setLoading(false);
      return;
    }

    try {
      const manager = dataManager.googleDriveManager;
      if (!manager || typeof manager.loadFileContent !== 'function') {
        throw createShareError('signInRequired');
      }

      const fileContent = await manager.loadFileContent(params.fileId);
      if (!fileContent) {
        throw createShareError('general');
      }

      const normalized = normalizeDriveContent(fileContent);
      if (!normalized) {
        throw createShareError('general');
      }

      let parsed;
      try {
        parsed = JSON.parse(normalized);
      } catch (error) {
        console.error('Failed to parse shared data JSON:', error);
        throw createShareError('general');
      }

      if (!parsed || typeof parsed !== 'object') {
        throw createShareError('general');
      }

      Object.assign(characterStore.character, parsed.character || {});
      characterStore.skills.splice(0, characterStore.skills.length, ...(parsed.skills || []));
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...(parsed.specialSkills || []));
      Object.assign(characterStore.equipments, parsed.equipments || {});
      characterStore.histories.splice(0, characterStore.histories.length, ...(parsed.histories || []));
      uiStore.isViewingShared = true;
    } catch (error) {
      const key = error.shareErrorKey || 'general';
      showToast({ type: 'error', ...messages.share.loadError.toast(key) });
      console.error('Error loading shared data:', error);
    } finally {
      uiStore.setLoading(false);
    }
  }

  return { initialize };
}
