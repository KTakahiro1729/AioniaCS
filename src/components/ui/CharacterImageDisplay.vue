<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="imagesInternal.length > 0">
        <img
          v-if="currentImageSrc"
          :src="currentImageSrc"
          class="character-image-display"
          alt="Character Image"
        />
        <button
          @click="previousImage"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="imagesInternal.length <= 1"
          aria-label="前の画像"
        >&lt;</button>
        <button
          @click="nextImage"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="imagesInternal.length <= 1"
          aria-label="次の画像"
        >&gt;</button>
        <div class="image-count-display">{{ currentImageIndex + 1 }} / {{ imagesInternal.length }}</div>
      </div>
      <div class="character-image-placeholder" v-else>No Image</div>
    </div>
    <div class="image-controls">
      <input
        type="file"
        id="character_image_upload"
        @change="handleImageUpload"
        accept="image/*"
        style="display: none"
      />
      <label for="character_image_upload" class="button-base imagefile-button imagefile-button--upload">画像を追加</label>
      <button
        :disabled="!currentImageSrc"
        @click="removeCurrentImage"
        class="button-base imagefile-button imagefile-button--delete"
        aria-label="現在の画像を削除"
      >削除</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ImageManager } from '../../services/imageManager.js';

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:images']);

const imagesInternal = ref([...props.images]);

watch(
  () => props.images,
  (val) => {
    imagesInternal.value = [...val];
  },
  { deep: true }
);

watch(
  imagesInternal,
  (val) => {
    emit('update:images', val);
  },
  { deep: true }
);

const currentImageIndex = ref(0);

const currentImageSrc = computed(() => {
  if (
    imagesInternal.value.length > 0 &&
    currentImageIndex.value >= 0 &&
    currentImageIndex.value < imagesInternal.value.length
  ) {
    return imagesInternal.value[currentImageIndex.value];
  }
  return null;
});

const nextImage = () => {
  if (imagesInternal.value.length > 0) {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % imagesInternal.value.length;
  }
};

const previousImage = () => {
  if (imagesInternal.value.length > 0) {
    currentImageIndex.value =
      (currentImageIndex.value - 1 + imagesInternal.value.length) %
      imagesInternal.value.length;
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
    alert('画像の読み込みに失敗しました：' + error.message);
  } finally {
    event.target.value = null;
  }
};
</script>

<style scoped>
</style>

