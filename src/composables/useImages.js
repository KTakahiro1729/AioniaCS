import { ref, computed } from 'vue';
import { IMAGE_SETTINGS } from '../config/imageSettings.js';
import { messages } from '../locales/ja.js';
import { useCharacterImageManager } from './useCharacterImageManager.js';

// 画像関連のロジックを提供するコンポーザブル関数
export function useImages(character, showCustomAlert) {
  const currentImageIndex = ref(0);
  const { uploadImage, deleteImage, isUploading, isDeleting } = useCharacterImageManager();

  const currentImageSrc = computed(() => {
    if (character.value?.images?.length > 0 && currentImageIndex.value < character.value.images.length) {
      return character.value.images[currentImageIndex.value];
    }
    return null;
  });

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    event.target.value = null;
    if (!file) return;

    if (!character.value.images) {
      character.value.images = [];
    }

    if (character.value.images.length >= IMAGE_SETTINGS.MAX_COUNT) {
      showCustomAlert(messages.image.limitNotice(IMAGE_SETTINGS.MAX_COUNT));
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        character.value.images.push(imageUrl);
        currentImageIndex.value = character.value.images.length - 1;
      }
    } catch (error) {
      showCustomAlert(`画像の読み込みに失敗しました：${error.message}`);
    }
  }

  function nextImage() {
    if (character.value?.images?.length > 1) {
      currentImageIndex.value = (currentImageIndex.value + 1) % character.value.images.length;
    }
  }

  function previousImage() {
    if (character.value?.images?.length > 1) {
      currentImageIndex.value = (currentImageIndex.value - 1 + character.value.images.length) % character.value.images.length;
    }
  }

  async function removeCurrentImage() {
    if (character.value?.images?.length > 0 && currentImageIndex.value >= 0) {
      const targetUrl = character.value.images[currentImageIndex.value];
      const success = await deleteImage(targetUrl);
      if (!success) {
        return;
      }

      character.value.images.splice(currentImageIndex.value, 1);
      if (character.value.images.length === 0) {
        currentImageIndex.value = -1;
      } else if (currentImageIndex.value >= character.value.images.length) {
        currentImageIndex.value = character.value.images.length - 1;
      }
    }
  }

  return {
    currentImageIndex,
    currentImageSrc,
    handleImageUpload,
    nextImage,
    previousImage,
    removeCurrentImage,
    isUploading,
    isDeleting,
  };
}
