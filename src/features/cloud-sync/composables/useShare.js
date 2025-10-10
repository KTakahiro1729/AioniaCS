import { useAuth0 } from '@auth0/auth0-vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/locales/ja.js';

const useMockDrive = import.meta.env.VITE_USE_MOCK_DRIVE === 'true';

export function useShare(dataManager) {
  const characterStore = useCharacterStore();
  const uiStore = useUiStore();
  const { showToast } = useNotifications();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  async function resolveAccessToken() {
    if (useMockDrive) {
      return 'mock-access-token';
    }

    if (!isAuthenticated.value) {
      throw new Error(messages.share.needSignIn().message);
    }

    try {
      const authorizationParams = {};
      const audience = import.meta.env.VITE_AUTH0_API_AUDIENCE;
      const scope = import.meta.env.VITE_AUTH0_DRIVE_SCOPE;
      if (audience) {
        authorizationParams.audience = audience;
      }
      if (scope) {
        authorizationParams.scope = scope;
      }

      const tokenResult = await getAccessTokenSilently({
        ...(Object.keys(authorizationParams).length > 0 ? { authorizationParams } : {}),
        detailedResponse: true,
      });
      const accessToken =
        (typeof tokenResult === 'object' && tokenResult?.resource_server?.access_token) ||
        (typeof tokenResult === 'string' ? tokenResult : tokenResult?.access_token);
      if (!accessToken) {
        throw new Error('アクセストークンの取得に失敗しました');
      }
      return accessToken;
    } catch (error) {
      throw new Error(error?.message || 'アクセストークンの取得に失敗しました');
    }
  }

  async function createShareLink() {
    if (!uiStore.isSignedIn && !useMockDrive) {
      throw new Error(messages.share.needSignIn().message);
    }

    const manager = dataManager.googleDriveManager;
    if (!manager || typeof manager.ensureFilePublic !== 'function') {
      throw new Error(messages.share.errors.managerMissing);
    }

    const accessToken = await resolveAccessToken();

    const result = await dataManager.saveCharacterToDrive(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
      uiStore.currentDriveFileId,
      { accessToken },
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

    const publishedLink = await manager.ensureFilePublic(accessToken, uiStore.currentDriveFileId || fileId);
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
