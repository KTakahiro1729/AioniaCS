<template>
  <div class="character-image-container">
    <div class="image-display-area">
      <div class="image-display-wrapper" v-if="images && images.length > 0">
        <img
          v-if="currentImageSrc"
          :src="currentImageSrc"
          class="character-image-display"
          alt="Character Image"
        />
        <button
          @click="emit('previous')"
          class="button-base button-imagenav button-imagenav--prev"
          :disabled="images.length <= 1"
          aria-label="前の画像"
        >&lt;</button>
        <button
          @click="emit('next')"
          class="button-base button-imagenav button-imagenav--next"
          :disabled="images.length <= 1"
          aria-label="次の画像"
        >&gt;</button>
        <div class="image-count-display">{{ currentIndex + 1 }} / {{ images.length }}</div>
      </div>
      <div class="character-image-placeholder" v-else>No Image</div>
    </div>
    <div class="image-controls">
      <input
        type="file"
        id="character_image_upload"
        @change="emit('upload', $event)"
        accept="image/*"
        style="display: none"
      />
      <label for="character_image_upload" class="button-base imagefile-button imagefile-button--upload">画像を追加</label>
      <button
        :disabled="!currentImageSrc"
        @click="emit('remove')"
        class="button-base imagefile-button imagefile-button--delete"
        aria-label="現在の画像を削除"
      >削除</button>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  images: Array,
  currentImageSrc: String,
  currentIndex: Number,
});
const emit = defineEmits(['upload', 'next', 'previous', 'remove']);
</script>
