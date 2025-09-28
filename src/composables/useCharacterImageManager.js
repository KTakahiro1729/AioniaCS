import { ref } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { CloudStorageService } from '../services/cloudStorageService.js';
import { ImageManager } from '../services/imageManager.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';

let cachedService = null;

function ensureService(getAccessTokenSilently) {
  if (!cachedService) {
    cachedService = new CloudStorageService(getAccessTokenSilently);
  }
  return cachedService;
}

export function useCharacterImageManager() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { showToast, showAsyncToast } = useNotifications();
  const isUploading = ref(false);
  const isDeleting = ref(false);

  function ensureSignedIn() {
    if (!isAuthenticated.value) {
      showToast({ type: 'error', ...messages.image.signInRequired() });
      return false;
    }
    return true;
  }

  async function uploadImage(file) {
    if (!file) {
      return null;
    }

    if (!ensureSignedIn()) {
      return null;
    }

    let preparedFile;
    try {
      preparedFile = await ImageManager.prepareForUpload(file);
    } catch (error) {
      showToast({ type: 'error', ...messages.image.upload.error(error) });
      return null;
    }

    isUploading.value = true;
    const service = ensureService(getAccessTokenSilently);
    const uploadPromise = service.uploadCharacterImage(preparedFile);

    showAsyncToast(uploadPromise, {
      loading: messages.image.upload.loading(),
      success: messages.image.upload.success(),
      error: (err) => messages.image.upload.error(err),
    });

    try {
      const result = await uploadPromise;
      if (!result?.url) {
        throw new Error('画像URLの取得に失敗しました。');
      }
      return result.url;
    } catch (error) {
      console.error('Character image upload failed:', error);
      return null;
    } finally {
      isUploading.value = false;
    }
  }

  async function deleteImage(url) {
    if (!url) {
      return false;
    }

    if (!ensureSignedIn()) {
      return false;
    }

    isDeleting.value = true;
    const service = ensureService(getAccessTokenSilently);
    const deletePromise = service.deleteCharacterImage(url);

    showAsyncToast(deletePromise, {
      loading: messages.image.delete.loading(),
      success: messages.image.delete.success(),
      error: (err) => messages.image.delete.error(err),
    });

    try {
      await deletePromise;
      return true;
    } catch (error) {
      console.error('Character image delete failed:', error);
      return false;
    } finally {
      isDeleting.value = false;
    }
  }

  return {
    uploadImage,
    deleteImage,
    isUploading,
    isDeleting,
  };
}
