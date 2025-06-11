import { ref, computed, onMounted } from "vue";
import { ImageManager } from "../../services/imageManager.js";

export function useImageManagement(character, showCustomAlert) {
  const currentImageIndex = ref(0);
  const imageManagerInstance = ref(null);

  onMounted(() => {
    imageManagerInstance.value = ImageManager;
  });

  const currentImageSrc = computed(() => {
    if (
      character.images &&
      character.images.length > 0 &&
      currentImageIndex.value >= 0 &&
      currentImageIndex.value < character.images.length
    ) {
      return character.images[currentImageIndex.value];
    }
    return null;
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!imageManagerInstance.value) {
      console.error("ImageManager not initialized");
      return;
    }
    try {
      const imageData = await imageManagerInstance.value.loadImage(file);
      if (!character.images) {
        character.images = [];
      }
      character.images.push(imageData);
      currentImageIndex.value = character.images.length - 1;
    } catch (error) {
      console.error("Error loading image:", error);
      if (showCustomAlert)
        showCustomAlert("画像の読み込みに失敗しました：" + error.message);
    } finally {
      event.target.value = null;
    }
  };

  const nextImage = () => {
    if (character.images && character.images.length > 0) {
      currentImageIndex.value =
        (currentImageIndex.value + 1) % character.images.length;
    }
  };

  const previousImage = () => {
    if (character.images && character.images.length > 0) {
      currentImageIndex.value =
        (currentImageIndex.value - 1 + character.images.length) %
        character.images.length;
    }
  };

  const removeCurrentImage = () => {
    if (
      character.images &&
      character.images.length > 0 &&
      currentImageIndex.value >= 0
    ) {
      character.images.splice(currentImageIndex.value, 1);
      if (character.images.length === 0) {
        currentImageIndex.value = -1;
      } else if (currentImageIndex.value >= character.images.length) {
        currentImageIndex.value = character.images.length - 1;
      }
    }
  };

  return {
    currentImageIndex,
    currentImageSrc,
    handleImageUpload,
    nextImage,
    previousImage,
    removeCurrentImage,
  };
}
