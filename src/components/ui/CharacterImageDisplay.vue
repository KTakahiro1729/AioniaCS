<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="imagesInternal.length > 0">
        <img v-if="currentImageSrc" :src="currentImageSrc" class="character-image-display" alt="Character Image" />
        <div v-if="isUploading" class="image-upload-overlay">
          <div class="loading-spinner" aria-hidden="true"></div>
          <span class="loading-text">{{ messages.image.upload.inProgress }}</span>
        </div>
        <button
          @click="previousImage"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="!canNavigate"
          aria-label="前の画像"
        >
          &lt;
        </button>
        <button
          @click="nextImage"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="!canNavigate"
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
        :disabled="limitReached || isUploading || isDeleting"
      />
      <label
        for="character_image_upload"
        class="button-base imagefile-button imagefile-button--upload"
        :class="{ 'imagefile-button--disabled': limitReached || isUploading || isDeleting }"
        :aria-disabled="limitReached || isUploading || isDeleting"
      >
        画像を追加
      </label>
      <button
        :disabled="!currentImageSrc || isUploading || isDeleting"
        @click="removeCurrentImage"
        class="button-base imagefile-button imagefile-button--delete"
        aria-label="現在の画像を削除"
      >
        削除
      </button>
      <p v-if="limitReached" class="image-limit-message">{{ messages.image.limitNotice(IMAGE_SETTINGS.MAX_COUNT) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { messages } from '../../locales/ja.js';
import { IMAGE_SETTINGS } from '../../config/imageSettings.js';
import { useCharacterImageManager } from '../../composables/useCharacterImageManager.js';

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:images']);
const uiStore = useUiStore();
const { showToast } = useNotifications();
const { uploadImage, deleteImage, isUploading, isDeleting } = useCharacterImageManager();

const imagesInternal = ref([...props.images]);
let updatingFromParent = false;

watch(
  () => props.images,
  (val) => {
    updatingFromParent = true;
    imagesInternal.value = [...val];
    nextTick(() => {
      updatingFromParent = false;
    });
  },
  { deep: true },
);

watch(
  imagesInternal,
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
    return imagesInternal.value[currentImageIndex.value];
  }
  return null;
});

const limitReached = computed(() => imagesInternal.value.length >= IMAGE_SETTINGS.MAX_COUNT);
const canNavigate = computed(() => imagesInternal.value.length > 1 && !isUploading.value && !isDeleting.value);

watch(
  () => imagesInternal.value.length,
  (length) => {
    if (length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value < 0) {
      currentImageIndex.value = 0;
    } else if (currentImageIndex.value >= length) {
      currentImageIndex.value = length - 1;
    }
  },
);

const nextImage = () => {
  if (imagesInternal.value.length > 0 && !isUploading.value && !isDeleting.value) {
    currentImageIndex.value = (currentImageIndex.value + 1) % imagesInternal.value.length;
  }
};

const previousImage = () => {
  if (imagesInternal.value.length > 0 && !isUploading.value && !isDeleting.value) {
    currentImageIndex.value = (currentImageIndex.value - 1 + imagesInternal.value.length) % imagesInternal.value.length;
  }
};

const removeCurrentImage = async () => {
  if (imagesInternal.value.length === 0 || currentImageIndex.value < 0) {
    return;
  }

  const targetUrl = imagesInternal.value[currentImageIndex.value];
  const success = await deleteImage(targetUrl);
  if (!success) {
    return;
  }

  imagesInternal.value.splice(currentImageIndex.value, 1);
  if (imagesInternal.value.length === 0) {
    currentImageIndex.value = -1;
  } else if (currentImageIndex.value >= imagesInternal.value.length) {
    currentImageIndex.value = imagesInternal.value.length - 1;
  }
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  event.target.value = null;
  if (!file) return;

  if (limitReached.value) {
    showToast({ type: 'error', ...messages.image.limitReached(IMAGE_SETTINGS.MAX_COUNT) });
    return;
  }

  const uploadedUrl = await uploadImage(file);
  if (uploadedUrl) {
    imagesInternal.value.push(uploadedUrl);
    currentImageIndex.value = imagesInternal.value.length - 1;
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

.image-upload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-text-inverse, #fff);
  gap: 0.5rem;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-top-color: var(--color-accent, #f5c518);
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  line-height: 1;
  min-width: auto;
  height: auto;
  font-weight: bold;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.button-imagenav:hover {
  background-color: var(--color-panel-sub-header);
}

.button-imagenav.button-imagenav--prev {
  left: 10px;
}

.button-imagenav.button-imagenav--next {
  right: 10px;
}

.button-imagenav:disabled {
  cursor: default;
}

.image-count-display {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background-color: var(--color-panel-header);
  color: white;
  padding: 3px 8px;
  font-size: 0.9em;
  border-radius: 3px;
  opacity: 0.3;
  transition: opacity 0.3s ease;
  cursor: default;
}

.image-display-wrapper:hover .image-count-display:hover {
  opacity: 1;
}

.image-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 10px 0;
}

.imagefile-button--add:hover:not(:disabled) {
  border-color: var(--color-accent);
}

.imagefile-button--delete {
  color: var(--color-delete-text);
  border-color: var(--color-delete-border);
}

.imagefile-button--delete:hover:not(:disabled) {
  border-color: var(--color-delete-text);
  box-shadow:
    inset 0 0 3px var(--color-delete-text),
    0 0 6px var(--color-delete-text);
  text-shadow: 0 0 2px var(--color-delete-text);
}

.imagefile-button--delete:disabled {
  cursor: default;
  background-color: transparent;
  color: var(--color-border-normal);
  border-color: var(--color-border-normal);
  box-shadow: none;
  text-shadow: none;
}

.imagefile-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.image-limit-message {
  flex-basis: 100%;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-muted, #b0b0b0);
  margin: 0;
}
</style>
