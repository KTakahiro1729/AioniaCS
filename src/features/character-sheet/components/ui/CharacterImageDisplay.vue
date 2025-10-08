<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="imagesInternal.length > 0">
        <img v-if="currentImageSrc" :src="currentImageSrc" class="character-image-display" :alt="sheetMessages.images.alt" />
        <button
          @click="previousImage"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="imagesInternal.length <= 1"
          :aria-label="sheetMessages.images.previous"
        >
          &lt;
        </button>
        <button
          @click="nextImage"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="imagesInternal.length <= 1"
          :aria-label="sheetMessages.images.next"
        >
          &gt;
        </button>
        <div class="image-count-display">{{ currentImageIndex + 1 }} / {{ imagesInternal.length }}</div>
      </div>
      <div class="character-image-placeholder" v-else>{{ sheetMessages.images.empty }}</div>
    </div>
    <div class="image-controls" v-if="!uiStore.isViewingShared">
      <input type="file" id="character_image_upload" @change="handleImageUpload" accept="image/*" style="display: none" />
      <label for="character_image_upload" class="button-base imagefile-button imagefile-button--upload">
        {{ sheetMessages.images.add }}
      </label>
      <button
        :disabled="!currentImageSrc"
        @click="removeCurrentImage"
        class="button-base imagefile-button imagefile-button--delete"
        :aria-label="sheetMessages.images.deleteAria"
      >
        {{ sheetMessages.images.delete }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { ImageManager } from '@/features/character-sheet/services/imageManager.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/locales/ja.js';

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:images']);
const uiStore = useUiStore();
const { showToast } = useNotifications();
const sheetMessages = messages.sheet;

const imagesInternal = ref([...props.images]);
let updatingFromParent = false;

watch(
  () => props.images,
  (val) => {
    updatingFromParent = true;
    imagesInternal.value = [...val];
    if (imagesInternal.value.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= imagesInternal.value.length) {
      currentImageIndex.value = imagesInternal.value.length - 1;
    } else if (currentImageIndex.value < 0) {
      currentImageIndex.value = 0;
    }
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

const currentImageIndex = ref(0);

const currentImageSrc = computed(() => {
  if (imagesInternal.value.length > 0 && currentImageIndex.value >= 0 && currentImageIndex.value < imagesInternal.value.length) {
    return imagesInternal.value[currentImageIndex.value];
  }
  return null;
});

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

const removeCurrentImage = () => {
  if (imagesInternal.value.length > 0 && currentImageIndex.value >= 0) {
    imagesInternal.value.splice(currentImageIndex.value, 1);
    if (imagesInternal.value.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= imagesInternal.value.length) {
      currentImageIndex.value = imagesInternal.value.length - 1;
    }
  }
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imageData = await ImageManager.loadImage(file);
    imagesInternal.value.push(imageData);
    currentImageIndex.value = imagesInternal.value.length - 1;
  } catch (error) {
    console.error('Error loading image:', error);
    showToast({ type: 'error', ...messages.image.loadError(error) });
  } finally {
    event.target.value = null;
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
</style>
