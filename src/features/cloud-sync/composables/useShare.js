import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/i18n/index.js';

function buildShareUrl(fileId) {
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = '';
  shareUrl.searchParams.delete('sharedId');
  shareUrl.searchParams.set('sharedId', fileId);
  return shareUrl.toString();
}

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();

  async function enableShare(fileId) {
    if (!uiStore.isSignedIn) {
      throw new Error(messages.share.needSignIn().message);
    }

    const manager = dataManager?.googleDriveManager;
    if (!manager || typeof manager.ensureFilePublic !== 'function') {
      throw new Error(messages.share.errors.managerMissing);
    }

    const targetId = fileId || uiStore.currentDriveFileId;
    if (!targetId) {
      throw new Error(messages.share.errors.shareFailed);
    }

    const publishedLink = await manager.ensureFilePublic(targetId);
    if (!publishedLink) {
      throw new Error(messages.share.errors.shareFailed);
    }

    return buildShareUrl(targetId);
  }

  async function disableShare(fileId) {
    if (!uiStore.isSignedIn) {
      throw new Error(messages.share.needSignIn().message);
    }

    const manager = dataManager?.googleDriveManager;
    if (!manager || typeof manager.unshareFile !== 'function') {
      throw new Error(messages.share.errors.managerMissing);
    }

    const targetId = fileId || uiStore.currentDriveFileId;
    if (!targetId) {
      throw new Error(messages.share.errors.shareFailed);
    }

    await manager.unshareFile(targetId);
    return targetId;
  }

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

    return enableShare(uiStore.currentDriveFileId || fileId);
  }

  return { createShareLink, enableShare, disableShare };
}
