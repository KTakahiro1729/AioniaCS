import { ref, computed } from "vue";
import { ImageManager } from "../services/imageManager.js";

// 画像関連のロジックを提供するコンポーザブル関数
export function useImages(character, showCustomAlert) {
  const currentImageIndex = ref(0);

  const currentImageSrc = computed(() => {
    if (
      character.value?.images?.length > 0 &&
      currentImageIndex.value < character.value.images.length
    ) {
      return character.value.images[currentImageIndex.value];
    }
    return null;
  });

  async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imageData = await ImageManager.loadImage(file);
      if (!character.value.images) {
        character.value.images = [];
      }
      character.value.images.push(imageData);
      currentImageIndex.value = character.value.images.length - 1;
    } catch (error) {
      showCustomAlert(`画像の読み込みに失敗しました：${error.message}`);
    } finally {
      if (event.target) event.target.value = null;
    }
  }

  function nextImage() {
    if (character.value?.images?.length > 1) {
      currentImageIndex.value =
        (currentImageIndex.value + 1) % character.value.images.length;
    }
  }

  function previousImage() {
    if (character.value?.images?.length > 1) {
      currentImageIndex.value =
        (currentImageIndex.value - 1 + character.value.images.length) %
        character.value.images.length;
    }
  }

  function removeCurrentImage() {
    if (character.value?.images?.length > 0 && currentImageIndex.value >= 0) {
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
  };
}
