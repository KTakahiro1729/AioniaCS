import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { deserializeCharacterPayload } from '../utils/characterSerialization.js';

export function useAppInitialization(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function initialize() {
    uiStore.setLoading(true);
    const url = new URL(window.location.href);
    const shareId = url.searchParams.get('shareId');
    if (!shareId) {
      uiStore.setLoading(false);
      return;
    }

    try {
      const payload = await fetchSharedCharacter(shareId);
      Object.assign(characterStore.character, payload.character);
      characterStore.skills.splice(0, characterStore.skills.length, ...payload.skills);
      characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...payload.specialSkills);
      Object.assign(characterStore.equipments, payload.equipments);
      characterStore.histories.splice(0, characterStore.histories.length, ...payload.histories);
      uiStore.isViewingShared = true;
    } catch (err) {
      const key = err?.code || 'general';
      showToast({ type: 'error', ...messages.share.loadError.toast(key) });
      console.error('Error loading shared data:', err);
    } finally {
      uiStore.setLoading(false);
    }
  }

  async function fetchSharedCharacter(fileId) {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    const baseUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;
    const url = new URL(baseUrl);
    url.searchParams.set('alt', 'media');
    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = new Error('Failed to load shared data');
      error.code = response.status === 404 ? 'notFound' : 'general';
      throw error;
    }

    const buffer = await response.arrayBuffer();
    const parsed = await deserializeCharacterPayload(buffer);
    return dataManager.parseLoadedData(parsed);
  }

  return { initialize };
}
