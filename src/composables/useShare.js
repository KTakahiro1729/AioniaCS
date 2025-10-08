import { useUiStore } from '../stores/uiStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

export function useShare(dataManager, saveCharacterToDrive) {
  const uiStore = useUiStore();
  const { showToast } = useNotifications();

  async function ensureDriveFile() {
    const manager = dataManager.googleDriveManager;
    if (!manager || !uiStore.isSignedIn) {
      throw new Error(messages.share.needSignIn().message);
    }

    if (typeof saveCharacterToDrive === 'function') {
      const result = await saveCharacterToDrive(false);
      if (!result || !result.id) {
        return null;
      }
      return result.id;
    }

    throw new Error(messages.share.errors.unsupportedShare);
  }

  async function ensurePublicAccess(fileId) {
    if (!fileId) {
      return null;
    }
    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.ensureFileIsShared !== 'function') {
      throw new Error(messages.share.errors.managerMissing);
    }
    const shared = await manager.ensureFileIsShared(fileId);
    if (!shared) {
      throw new Error(messages.share.errors.makePublicFailed);
    }
    return fileId;
  }

  async function generateShare() {
    const fileId = await ensureDriveFile();
    if (!fileId) {
      return null;
    }
    await ensurePublicAccess(fileId);
    const { origin, pathname } = window.location;
    const base = `${origin}${pathname}`;
    return `${base}?shareId=${encodeURIComponent(fileId)}`;
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast({ type: 'success', ...messages.share.copied(link) });
    } catch (err) {
      showToast({ type: 'error', ...messages.share.copyFailed(err) });
    }
  }

  return { generateShare, copyLink };
}
