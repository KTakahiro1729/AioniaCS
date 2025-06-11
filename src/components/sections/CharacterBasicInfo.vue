<template>
  <div id="character_info" class="character-info">
    <div class="box-title">基本情報</div>
    <div class="box-content">
      <CharacterImageDisplay
        :images="character.images"
        :current-image-src="currentImageSrc"
        :current-index="currentImageIndex"
        @upload="onImageUpload"
        @next="nextImage"
        @previous="previousImage"
        @remove="removeCurrentImage"
      />
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">キャラクター名</label>
          <BaseInput id="name" v-model="character.name" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">プレイヤー名</label>
          <BaseInput id="player_name" v-model="character.playerName" />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import CharacterImageDisplay from '../ui/CharacterImageDisplay.vue';
import BaseInput from '../common/BaseInput.vue';
const props = defineProps({
  character: Object,
  currentImageSrc: String,
  currentImageIndex: Number,
});
const emit = defineEmits(['upload', 'next', 'previous', 'remove']);
const onImageUpload = (e) => emit('upload', e);
const nextImage = () => emit('next');
const previousImage = () => emit('previous');
const removeCurrentImage = () => emit('remove');
</script>
