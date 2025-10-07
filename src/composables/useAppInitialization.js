import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

function parseDriveShareLocation(location) {
  if (!location || typeof location.hash !== 'string') {
    return null;
  }
  const hash = location.hash.trim();
  const match = hash.match(/^#\/share\/drive\/([^/?#]+)/i);
  if (!match) {
    return null;
  }
  try {
    return { provider: 'drive', fileId: decodeURIComponent(match[1]) };
  } catch (error) {
    console.error('Failed to decode shared file ID from URL hash:', error);
    return null;
  }
}

function normalizeDriveContent(content) {
  if (content == null) {
    return null;
  }
  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return new TextDecoder().decode(content);
  }
  if (ArrayBuffer.isView(content)) {
    return new TextDecoder().decode(content);
  }
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content);
    } catch (error) {
      console.error('Failed to serialize Drive content object:', error);
    }
  }
  return null;
}

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function initialize() {
    uiStore.setLoading(true);
    const params = parseDriveShareLocation(window.location);
    if (!params || params.provider !== 'drive') {
      uiStore.setLoading(false);
      return;
    }
    try {
      const manager = dataManager.googleDriveManager;
      if (!manager || typeof manager.loadFileContent !== 'function') {
        throw new Error(messages.share.errors.managerMissing);
      }
      if (!params.fileId) {
        throw new Error(messages.share.errors.missingReadId);
      }
      const rawContent = await manager.loadFileContent(params.fileId);
      if (!rawContent) {
        throw new Error(messages.share.errors.fetchFailed);
      }
      const normalized = normalizeDriveContent(rawContent);
      if (!normalized) {
        throw new Error(messages.share.errors.fetchFailed);
      }

      let parsed;
      try {
        parsed = JSON.parse(normalized);
      } catch (error) {
        console.error('Failed to parse shared Drive payload:', error);
        throw new Error(messages.share.errors.invalidPayload);
      }

      const payload = parsed?.character ? parsed : parsed?.data || parsed;
      if (!payload || typeof payload !== 'object' || !payload.character) {
        throw new Error(messages.share.errors.invalidPayload);
      }

      Object.assign(characterStore.character, payload.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...(payload.skills || []));
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...(payload.specialSkills || []));
      Object.assign(characterStore.equipments, payload.equipments || {});
      characterStore.histories.splice(0, characterStore.histories.length, ...(payload.histories || []));
      uiStore.isViewingShared = true;
    } catch (err) {
      const fallback = messages.share.loadError.toast('general');
      showToast({
        type: 'error',
        title: fallback.title,
        message: err?.message || fallback.message,
      });
      console.error('Error loading shared data:', err);
    } finally {
      uiStore.setLoading(false);
    }
  }

  return { initialize };
}
