import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/locales/ja.js';

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

    const publishedLink = await manager.ensureFilePublic(uiStore.currentDriveFileId || fileId);
    if (!publishedLink) {
      throw new Error(messages.share.errors.shareFailed);
    }

    const shareUrl = new URL(window.location.href);
    shareUrl.hash = '';
    shareUrl.searchParams.delete('sharedId');
    shareUrl.searchParams.set('sharedId', uiStore.currentDriveFileId || fileId);
    return shareUrl.toString();
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
