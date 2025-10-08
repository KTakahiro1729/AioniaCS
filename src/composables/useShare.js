import { useCharacterStore } from '../stores/characterStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  function ensureDriveManager() {
    const manager = dataManager.googleDriveManager;
    if (!manager || !uiStore.isSignedIn) {
      throw new Error(messages.share.needSignIn().message);
    }
    return manager;
  }

  async function ensureDriveFile() {
    const manager = ensureDriveManager();
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
    uiStore.setCurrentDriveFileId(fileId);
    return { manager, fileId };
  }

  async function generateShareLink() {
    const { manager, fileId } = await ensureDriveFile();
    const link = await manager.shareCharacterFile(fileId);
    if (!link) {
      throw new Error(messages.share.errors.linkFailed);
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

  return { generateShareLink, copyLink };
}
