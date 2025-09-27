import { computed, watch } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useUiStore } from '../stores/uiStore.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { CloudStorageService } from '../services/cloudStorageService.js';

export function useCloudSync(dataManager) {
  const uiStore = useUiStore();
  const characterStore = useCharacterStore();
  const { showToast, showAsyncToast } = useNotifications();
  const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0();
  const cloudStorageService = new CloudStorageService(getAccessTokenSilently);

  dataManager.setCloudStorageService(cloudStorageService);

  const canUseCloud = computed(() => isAuthenticated.value);

  watch(
    () => [isAuthenticated.value, isLoading.value],
    async ([signedIn, stillLoading]) => {
      // 認証済みで、かつ、ロードが完了している場合にのみ実行
      if (signedIn && !stillLoading) {
        uiStore.isSignedIn = true;
        const userId = user.value?.sub || 'guest';
        dataManager.setCloudUserId(userId);
        try {
          await uiStore.refreshCloudCharacters(dataManager);
        } catch (error) {
          console.error('Failed to refresh characters on auth change:', error);
          // 必要であれば、ユーザーにエラー通知を表示
          showToast({ type: 'error', ...messages.cloudStorage.load.error(error) });
        }
      } else if (!signedIn && !stillLoading) {
        // サインアウト済みで、ロードが完了している場合
        uiStore.isSignedIn = false;
        dataManager.setCloudUserId(null);
        uiStore.clearCloudCharacters();
        uiStore.currentCloudFileId = null;
      }
    },
    { immediate: true },
  );

  async function refreshHubList() {
    if (!canUseCloud.value) return;
    await uiStore.refreshCloudCharacters(dataManager);
  }

  async function saveCharacterToCloud(fileId) {
    if (!canUseCloud.value) {
      showToast({ type: 'error', ...messages.share.needSignIn() });
      return;
    }

    uiStore.isCloudSaveSuccess = false;

    const savePromise = dataManager
      .saveDataToAppData(
        characterStore.character,
        characterStore.skills,
        characterStore.specialSkills,
        characterStore.equipments,
        characterStore.histories,
        fileId,
      )
      .then((result) => {
        if (result?.id) {
          uiStore.isCloudSaveSuccess = true;
          uiStore.currentCloudFileId = result.id;
        }
      })
      .then(() => refreshHubList());

    showAsyncToast(savePromise, {
      loading: messages.cloudStorage.save.loading(),
      success: messages.cloudStorage.save.success(),
      error: (err) => messages.cloudStorage.save.error(err),
    });

    return savePromise;
  }

  function saveOrUpdateCurrentCharacterInCloud() {
    return saveCharacterToCloud(uiStore.currentCloudFileId);
  }

  function handleSignInClick() {
    loginWithRedirect();
  }

  function handleSignOutClick() {
    logout({ logoutParams: { returnTo: window.location.origin } });
  }

  return {
    canUseCloud,
    handleSignInClick,
    handleSignOutClick,
    saveCharacterToCloud,
    saveOrUpdateCurrentCharacterInCloud,
    refreshHubList,
  };
}
