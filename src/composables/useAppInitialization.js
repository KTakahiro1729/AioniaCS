import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { deserializeCharacterPayload } from '../utils/characterSerialization.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function initialize() {
    uiStore.setLoading(true);
    const searchParams = new URLSearchParams(window.location.search);
    const shareId = searchParams.get('shareId');
    if (!shareId) {
      uiStore.setLoading(false);
      return;
    }
    try {
      if (!dataManager.googleDriveManager || typeof dataManager.googleDriveManager.loadFileContent !== 'function') {
        throw new Error('Google Drive manager is not available.');
      }

      const content = await dataManager.googleDriveManager.loadFileContent(shareId);
      if (!content) {
        throw new Error('Shared file is unavailable.');
      }

      const parsed = await deserializeCharacterPayload(content);
      const character = parsed?.character || {};
      const skills = Array.isArray(parsed?.skills) ? parsed.skills : [];
      const specialSkills = Array.isArray(parsed?.specialSkills) ? parsed.specialSkills : [];
      const equipments = parsed?.equipments || {};
      const histories = Array.isArray(parsed?.histories) ? parsed.histories : [];

      Object.assign(characterStore.character, character);
      characterStore.skills.splice(0, characterStore.skills.length, ...skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...specialSkills);
      Object.assign(characterStore.equipments, equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...histories);
      uiStore.isViewingShared = true;
      const url = new URL(window.location.href);
      url.searchParams.delete('shareId');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch (err) {
      showToast({ type: 'error', ...messages.share.loadError.toast('general') });
      console.error('Error loading shared data:', err);
    } finally {
      uiStore.setLoading(false);
    }
  }

  return { initialize };
}
