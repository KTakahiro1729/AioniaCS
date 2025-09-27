<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="imagesInternal.length > 0">
        <img v-if="currentImageSrc" :src="currentImageSrc" class="character-image-display" alt="Character Image" />
        <button
          @click="previousImage"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="imagesInternal.length <= 1"
          aria-label="前の画像"
        >
          &lt;
        </button>
        <button
          @click="nextImage"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="imagesInternal.length <= 1"
          aria-label="次の画像"
        >
          &gt;
        </button>
        <div class="image-count-display">{{ currentImageIndex + 1 }} / {{ imagesInternal.length }}</div>
      </div>
      <div class="character-image-placeholder" v-else>No Image</div>
    </div>
    <div class="image-controls" v-if="!uiStore.isViewingShared">
      <input
        type="file"
        id="character_image_upload"
        @change="handleImageUpload"
        accept="image/*"
        style="display: none"
        :disabled="!canAddMore"
      />
      <label
        for="character_image_upload"
        class="button-base imagefile-button imagefile-button--upload"
        :aria-disabled="!canAddMore"
      >
        {{ isUploading ? 'アップロード中…' : '画像を追加' }}
      </label>
      <button
        :disabled="!currentImageSrc || isDeleting"
        @click="removeCurrentImage"
        class="button-base imagefile-button imagefile-button--delete"
        aria-label="現在の画像を削除"
      >
        {{ isDeleting ? '削除中…' : '削除' }}
      </button>
      <div class="image-limit-text">{{ imagesInternal.length }} / {{ MAX_IMAGES_PER_CHARACTER }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { messages } from '../../locales/ja.js';
import {
  MAX_IMAGES_PER_CHARACTER,
  compressImageFile,
  fileToDataUrl,
  validateImageLimit,
  validateImageType,
} from '../../utils/imageProcessing.js';
import { CharacterImageService } from '../../services/characterImageService.js';

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:images']);
const { isAuthenticated, getAccessTokenSilently } = useAuth0();
const characterStore = useCharacterStore();
const uiStore = useUiStore();
const { showToast } = useNotifications();
const imageService = new CharacterImageService(getAccessTokenSilently);

const normalizeImage = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return {
      id: null,
      key: null,
      url: entry,
      previewUrl: entry.startsWith('data:') ? entry : null,
      contentType: null,
      fileName: null,
    };
  }

  if (typeof entry === 'object') {
    const preview =
      entry.previewUrl || entry.dataUrl || (typeof entry.url === 'string' && entry.url.startsWith('data:') ? entry.url : null);
    return {
      id: entry.id ?? null,
      key: entry.key ?? null,
      url: entry.url ?? preview ?? null,
      previewUrl: preview,
      contentType: entry.contentType ?? null,
      fileName: entry.fileName ?? null,
    };
  }

  return null;
};

const imagesInternal = ref((props.images || []).map(normalizeImage).filter(Boolean));
let updatingFromParent = false;

watch(
  () => props.images,
  (val) => {
    updatingFromParent = true;
    imagesInternal.value = (val || []).map(normalizeImage).filter(Boolean);
    if (imagesInternal.value.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value < 0) {
      currentImageIndex.value = 0;
    } else if (currentImageIndex.value >= imagesInternal.value.length) {
      currentImageIndex.value = imagesInternal.value.length - 1;
    }
    nextTick(() => {
      updatingFromParent = false;
    });
  },
  { deep: true },
);

const sanitizedImages = computed(() =>
  imagesInternal.value
    .map((image) => {
      if (!image || !image.url) return null;
      return {
        id: image.id,
        key: image.key,
        url: image.url,
        contentType: image.contentType,
        fileName: image.fileName,
      };
    })
    .filter(Boolean),
);

watch(
  sanitizedImages,
  (val) => {
    if (!updatingFromParent) {
      emit('update:images', val);
    }
  },
  { deep: true },
);

const currentImageIndex = ref(imagesInternal.value.length > 0 ? 0 : -1);

const currentImageSrc = computed(() => {
  if (imagesInternal.value.length > 0 && currentImageIndex.value >= 0 && currentImageIndex.value < imagesInternal.value.length) {
    const current = imagesInternal.value[currentImageIndex.value];
    return current?.previewUrl || current?.url || null;
  }
  return null;
});

const isUploading = ref(false);
const isDeleting = ref(false);

const canAddMore = computed(() => imagesInternal.value.length < MAX_IMAGES_PER_CHARACTER && !isUploading.value);

const nextImage = () => {
  if (imagesInternal.value.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % imagesInternal.value.length;
  }
};

const previousImage = () => {
  if (imagesInternal.value.length > 0) {
    currentImageIndex.value = (currentImageIndex.value - 1 + imagesInternal.value.length) % imagesInternal.value.length;
  }
};

const removeCurrentImage = async () => {
  if (imagesInternal.value.length === 0 || currentImageIndex.value < 0) {
    return;
  }

  const image = imagesInternal.value[currentImageIndex.value];
  if (!image) {
    return;
  }

  if (!image.key) {
    imagesInternal.value.splice(currentImageIndex.value, 1);
    if (imagesInternal.value.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= imagesInternal.value.length) {
      currentImageIndex.value = imagesInternal.value.length - 1;
    }
    return;
  }

  isDeleting.value = true;
  try {
    await imageService.deleteImage({
      imageFolderId: characterStore.character.imageFolderId,
      key: image.key,
      imageId: image.id,
    });
    imagesInternal.value.splice(currentImageIndex.value, 1);
    if (imagesInternal.value.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= imagesInternal.value.length) {
      currentImageIndex.value = imagesInternal.value.length - 1;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    showToast({ type: 'error', ...messages.image.deleteError(error) });
  } finally {
    isDeleting.value = false;
  }
};

const handleImageUpload = async (event) => {
  const files = Array.from(event.target.files || []);
  event.target.value = null;
  if (!files.length) return;

  const file = files[0];
  try {
    validateImageLimit(imagesInternal.value.length, files.length);
    validateImageType(file);
  } catch (error) {
    showToast({ type: 'error', ...messages.image.validationError(error) });
    return;
  }

  if (!isAuthenticated.value) {
    showToast({ type: 'error', ...messages.image.notSignedIn() });
    return;
  }

  if (!characterStore.character.imageFolderId) {
    showToast({ type: 'error', ...messages.image.missingFolderId() });
    return;
  }

  isUploading.value = true;
  try {
    const compressed = await compressImageFile(file);
    const dataUrl = await fileToDataUrl(compressed);
    const base64Data = dataUrl.split(',')[1];
    const response = await imageService.uploadImage({
      imageFolderId: characterStore.character.imageFolderId,
      data: base64Data,
      contentType: compressed.type || file.type,
      fileName: file.name,
    });

    const uploadedImage = normalizeImage({
      id: response?.id ?? null,
      key: response?.key ?? null,
      url: response?.url ?? null,
      previewUrl: dataUrl,
      contentType: response?.contentType ?? compressed.type ?? file.type ?? null,
      fileName: response?.fileName ?? file.name,
    });

    if (uploadedImage) {
      imagesInternal.value.push(uploadedImage);
      currentImageIndex.value = imagesInternal.value.length - 1;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    showToast({ type: 'error', ...messages.image.uploadError(error) });
  } finally {
    isUploading.value = false;
  }
};
</script>

<style scoped>
.character-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
  padding: 0;
  border: 1px solid var(--color-border-normal);
  border-radius: 3px;
  background-color: var(--color-input-bg);
}

.image-display-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  width: 100%;
  height: 350px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border-normal);
  border-radius: 2px;
}

.character-image-container img.character-image-display {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  object-fit: contain;
}

.character-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-input-disabled);
}

.image-display-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-display-wrapper .character-image-display {
  display: block;
}

.image-display-wrapper:hover .button-imagenav:not(:disabled) {
  opacity: 1;
}

.image-display-wrapper:hover .image-count-display {
  opacity: 0.7;
}

.button-imagenav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background-color: var(--color-panel-header);
  border: none;
  padding: 6px 10px;
  font-size: 1.2em;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.button-imagenav--prev {
  left: 5px;
}

.button-imagenav--next {
  right: 5px;
}

.button-imagenav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.image-count-display {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.imagefile-button {
  min-width: 120px;
  text-align: center;
}

.imagefile-button[aria-disabled='true'] {
  opacity: 0.5;
  pointer-events: none;
}

.image-limit-text {
  font-size: 0.85em;
  color: var(--color-text-subtle);
}
</style>
