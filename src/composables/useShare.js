import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function createShareLink() {
    if (!uiStore.isSignedIn) {
      throw new Error(messages.share.needSignIn().message);
    }

    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.ensureFilePublic !== 'function') {
      throw new Error(messages.share.errors.managerMissing);
    }

    const result = await dataManager.saveCharacterToDrive(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
      uiStore.currentDriveFileId,
    );

    const fileId = result?.id || uiStore.currentDriveFileId;
    if (!fileId) {
      throw new Error(messages.share.errors.saveFailed);
    }

    if (!result?.id && !uiStore.currentDriveFileId) {
      throw new Error(messages.share.errors.saveFailed);
    }

    if (result?.id) {
      uiStore.setCurrentDriveFileId(result.id);
    }

    const link = await manager.ensureFilePublic(uiStore.currentDriveFileId || fileId);
    if (!link) {
      throw new Error(messages.share.errors.shareFailed);
    }
    return link;
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast({ type: 'success', ...messages.share.copied(link) });
    } catch (err) {
      showToast({ type: 'error', ...messages.share.copyFailed(err) });
    }
  }

  return { createShareLink, copyLink };
}
