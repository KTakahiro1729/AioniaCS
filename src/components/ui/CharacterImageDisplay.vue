<script setup>
import { computed } from 'vue';
const props = defineProps({
  images: Array,
  currentIndex: Number,
});
const emit = defineEmits(['previous', 'next', 'upload', 'delete']);
const currentImageSrc = computed(() =>
  props.images && props.images.length > 0 ? props.images[props.currentIndex] : null
);
</script>
<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="props.images && props.images.length > 0">
        <img v-if="currentImageSrc" :src="currentImageSrc" class="character-image-display" alt="Character Image" />
        <button
          @click="emit('previous')"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="props.images.length <= 1"
          aria-label="前の画像"
        >&lt;</button>
        <button
          @click="emit('next')"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="props.images.length <= 1"
          aria-label="次の画像"
        >&gt;</button>
        <div class="image-count-display">{{ props.currentIndex + 1 }} / {{ props.images.length }}</div>
      </div>
      <div class="character-image-placeholder" v-else>No Image</div>
    </div>
    <div class="image-controls">
      <input
        type="file"
        id="character_image_upload"
        @change="(e) => emit('upload', e)"
        accept="image/*"
        style="display: none"
      />
      <label for="character_image_upload" class="button-base imagefile-button imagefile-button--upload">画像を追加</label>
      <button
        :disabled="!currentImageSrc"
        @click="emit('delete')"
        class="button-base imagefile-button imagefile-button--delete"
        aria-label="現在の画像を削除"
      >削除</button>
    </div>
  </div>
</template>
