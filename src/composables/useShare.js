import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { serializeCharacterForExport } from '../utils/characterSerialization.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const { showToast } = useNotifications();
  let lastSharedFileId = null;

  function collectSharePayload(includeFull) {
    const { data, images } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: includeFull,
    });

    if (includeFull && images.length > 0) {
      data.character.images = images;
    }

    return data;
  }

  function isLongData() {
    const { data } = serializeCharacterForExport({
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      histories: characterStore.histories,
      includeImages: false,
    });
    const payload = JSON.stringify({
      character: data.character,
      skills: data.skills,
    });
    return payload.length > 7000; // rough threshold
  }

  async function generateShare(options) {
    const { includeFull = false } = options || {};
    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.saveSharedSnapshot !== 'function') {
      throw new Error(messages.share.needSignIn().message);
    }

    const payload = collectSharePayload(includeFull);
    const snapshot = {
      name: characterStore.character?.name || '',
      content: JSON.stringify({
        version: 1,
        sharedAt: new Date().toISOString(),
        ...payload,
      }),
      fileId: lastSharedFileId,
    };

    let result;
    try {
      result = await manager.saveSharedSnapshot(snapshot);
    } catch (error) {
      console.error('Failed to save shared snapshot to Drive:', error);
      throw new Error(messages.share.errors.saveFailed);
    }
    if (!result || !result.id) {
      throw new Error(messages.share.errors.saveFailed);
    }

    try {
      await manager.setPermissionToPublic(result.id);
    } catch (error) {
      console.error('Failed to update Drive permissions for share:', error);
      throw new Error(messages.share.errors.permissionFailed);
    }

    lastSharedFileId = result.id;

    const baseUrl = new URL(window.location.href);
    baseUrl.hash = `#/share/drive/${encodeURIComponent(result.id)}`;
    return baseUrl.toString();
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast({ type: 'success', ...messages.share.copied(link) });
    } catch (err) {
      showToast({ type: 'error', ...messages.share.copyFailed(err) });
    }
  }

  return { generateShare, copyLink, isLongData };
}
