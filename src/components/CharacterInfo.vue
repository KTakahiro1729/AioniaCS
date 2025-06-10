<template>
  <div class="character-info">
    <div class="box-title">基本情報</div>
    <div class="box-content">
      <div class="character-image-container">
        <div class="image-display-area">
          <div class="image-display-wrapper" v-if="character.images && character.images.length > 0">
            <img
              v-if="currentImageSrc"
              :src="currentImageSrc"
              class="character-image-display"
              alt="Character Image"
            />
            <button
              @click="previousImage"
              class="button-base button-imagenav button-imagenav--prev"
              :disabled="character.images.length <= 1"
              aria-label="前の画像"
            >&lt;</button>
            <button
              @click="nextImage"
              class="button-base button-imagenav button-imagenav--next"
              :disabled="character.images.length <= 1"
              aria-label="次の画像"
            >&gt;</button>
            <div class="image-count-display">{{ currentImageIndex + 1 }} / {{ character.images.length }}</div>
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
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">キャラクター名</label>
          <input type="text" id="name" v-model="character.name" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">プレイヤー名</label>
          <input type="text" id="player_name" v-model="character.playerName"/>
        </div>
      </div>
      <div class="info-row">
        <div class="info-item" :class="{'info-item--full': character.species !== 'other', 'info-item--double': character.species === 'other'}">
          <label for="species">種族</label>
          <select id="species" v-model="character.species" @change="handleSpeciesChange">
            <option
              v-for="option in AioniaGameData.speciesOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >{{ option.label }}</option>
          </select>
        </div>
        <div class="info-item info-item--double" v-if="character.species === 'other'">
          <label for="rare_species">種族名（希少人種）</label>
          <input type="text" id="rare_species" v-model="character.rareSpecies"/>
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--quadruple">
          <label for="gender">性別</label>
          <input type="text" id="gender" v-model="character.gender" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="age">年齢</label>
          <input type="number" id="age" v-model.number="character.age" min="0"/>
        </div>
        <div class="info-item info-item--quadruple">
          <label for="height">身長</label>
          <input type="text" id="height" v-model="character.height" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="weight_char">体重</label>
          <input type="text" id="weight_char" v-model="character.weight"/>
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--triple">
          <label for="origin">出身地</label>
          <input type="text" id="origin" v-model="character.origin" />
        </div>
        <div class="info-item info-item--triple">
          <label for="occupation">職業</label>
          <input type="text" id="occupation" v-model="character.occupation"/>
        </div>
        <div class="info-item info-item--triple">
          <label for="faith">信仰</label>
          <input type="text" id="faith" v-model="character.faith" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, defineProps, defineEmits } from 'vue';
import { AioniaGameData } from '../data/gameData.js';
import { ImageManager } from '../services/imageManager.js';

const props = defineProps({
  character: Object,
});

const emit = defineEmits(['update:character', 'image-updated']);

const currentImageIndex = ref(0);

const currentImageSrc = computed(() => {
  if (
    props.character.images &&
    props.character.images.length > 0 &&
    currentImageIndex.value >= 0 &&
    currentImageIndex.value < props.character.images.length
  ) {
    return props.character.images[currentImageIndex.value];
  }
  return null;
});

const handleSpeciesChange = () => {
  const newCharacter = { ...props.character };
  if (newCharacter.species !== "other") {
    newCharacter.rareSpecies = "";
  }
  emit('update:character', newCharacter);
};

const showCustomAlert = (message) => alert(message);

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!ImageManager) {
    console.error("ImageManager not initialized");
    return;
  }
  try {
    const imageData = await ImageManager.loadImage(file);
    const newCharacter = { ...props.character };
    if (!newCharacter.images) {
      newCharacter.images = [];
    }
    newCharacter.images.push(imageData);
    currentImageIndex.value = newCharacter.images.length - 1;
    emit('update:character', newCharacter);
    emit('image-updated');
  } catch (error) {
    console.error("Error loading image:", error);
    showCustomAlert("画像の読み込みに失敗しました：" + error.message);
  } finally {
    event.target.value = null;
  }
};

const nextImage = () => {
  if (props.character.images && props.character.images.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % props.character.images.length;
  }
};

const previousImage = () => {
  if (props.character.images && props.character.images.length > 0) {
    currentImageIndex.value = (currentImageIndex.value - 1 + props.character.images.length) % props.character.images.length;
  }
};

const removeCurrentImage = () => {
  if (props.character.images && props.character.images.length > 0 && currentImageIndex.value >= 0) {
    const newCharacter = { ...props.character };
    newCharacter.images.splice(currentImageIndex.value, 1);
    if (newCharacter.images.length === 0) {
      currentImageIndex.value = -1;
    } else if (currentImageIndex.value >= newCharacter.images.length) {
      currentImageIndex.value = newCharacter.images.length - 1;
    }
    emit('update:character', newCharacter);
    emit('image-updated');
  }
};

</script>

<style scoped>
/* .character-info, .box-title, .box-content are styled by global _components.css and _layout.css */
/* .info-row and .info-item variants are styled by global _layout.css */
/* General label, input, select styles are from global _components.css */

/* Styles moved from _sections.css */
.character-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px; /* var(--spacing-medium) was 15px */
  padding: 0;
  border: 1px solid var(--color-border-normal);
  border-radius: 3px;
  background-color: var(--color-input-bg); /* from _sections.css */
}

.image-display-area {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0; /* from _sections.css, was var(--spacing-small) */
  width: 100%; /* from _sections.css */
  height: 350px; /* from _sections.css */
  background-color: var(--color-background); /* from _sections.css */
  border: 1px solid var(--color-border-normal); /* from _sections.css */
  border-radius: 2px; /* from _sections.css */
  position: relative;
  overflow: hidden;
}

/* .character-image-container img.character-image-display in _sections.css */
/* Assuming .character-image-display is on the img tag directly */
.character-image-display {
  max-width: 100%; /* from _sections.css */
  max-height: 100%; /* from _sections.css */
  height: auto; /* from _sections.css */
  object-fit: contain; /* from _sections.css, was already here */
  display: block; /* from _sections.css for .image-display-wrapper .character-image-display */
}

.character-image-placeholder {
  width: 100%; /* from _sections.css */
  height: 100%; /* from _sections.css */
  display: flex; /* from _sections.css */
  align-items: center; /* from _sections.css */
  justify-content: center; /* from _sections.css */
  color: var(--color-text-input-disabled); /* from _sections.css */
  font-size: var(--font-size-small); /* was already here */
}

.image-display-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex; /* from _sections.css */
  align-items: center; /* from _sections.css */
  justify-content: center; /* from _sections.css */
}

.image-display-wrapper:hover .button-imagenav:not(:disabled) {
  opacity: 1; /* from _sections.css */
}

.image-display-wrapper:hover .image-count-display {
  opacity: 0.7; /* from _sections.css */
}
.image-display-wrapper:hover .image-count-display:hover { /* Added from _sections.css for specificity */
  opacity: 1;
}


.button-imagenav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10; /* from _sections.css, was already here */
  background-color: var(--color-panel-header); /* from _sections.css */
  border: none; /* from _sections.css, was already here */
  padding: 6px 10px; /* from _sections.css, was var(--spacing-small) var(--spacing-xsmall) */
  font-size: 1.2em; /* from _sections.css, was var(--font-size-large) */
  line-height: 1; /* from _sections.css */
  min-width: auto; /* from _sections.css */
  height: auto; /* from _sections.css */
  font-weight: bold; /* from _sections.css */
  border-radius: 4px; /* from _sections.css, was var(--border-radius-small) */
  opacity: 0.6; /* from _sections.css */
  transition: opacity 0.3s ease; /* from _sections.css */
  cursor: pointer; /* was already here */
  color: white; /* was already here, ensure it's not overridden by .button-base if it has a different color */
}
.button-imagenav:hover {
  background-color: var(--color-panel-sub-header); /* from _sections.css, was rgba(0,0,0,0.5) */
}
.button-imagenav:disabled {
  opacity: 0.5; /* was already here, _sections.css uses cursor: default */
  cursor: default; /* from _sections.css */
}

.button-imagenav--prev {
  left: 10px; /* from _sections.css, was var(--spacing-xsmall) */
}

.button-imagenav--next {
  right: 10px; /* from _sections.css, was var(--spacing-xsmall) */
}

.image-count-display {
  position: absolute;
  top: 10px; /* from _sections.css, was bottom: var(--spacing-xsmall) */
  right: 10px; /* from _sections.css, was var(--spacing-xsmall) */
  z-index: 10; /* from _sections.css */
  background-color: var(--color-panel-header); /* from _sections.css, was rgba(0,0,0,0.6) */
  color: white; /* was already here */
  padding: 3px 8px; /* from _sections.css, was 2px var(--spacing-xsmall) */
  font-size: 0.9em; /* from _sections.css, was var(--font-size-xsmall) */
  border-radius: 3px; /* from _sections.css, was var(--border-radius-small) */
  opacity: 0.3; /* from _sections.css */
  transition: opacity 0.3s ease; /* from _sections.css */
  cursor: default; /* from _sections.css */
}

.image-controls {
  display: flex;
  gap: 10px; /* from _sections.css, was var(--spacing-small) */
  align-items: center; /* from _sections.css */
  flex-wrap: wrap; /* from _sections.css */
  justify-content: center; /* Center buttons horizontally */
  padding: 10px 0; /* from _sections.css */
  width: 100%;
  /* margin-top: var(--spacing-xsmall); was here, now padding handles spacing */
}
/* End of styles moved from _sections.css */


/* Specific styles for .imagefile-button that might not be covered by .button-base or global styles */
.imagefile-button {
  /* font-size from _components.css footer-button is 0.95em. */
  /* padding from _components.css footer-button is 10px 18px. */
  /* The original scoped style had:
     padding: var(--spacing-xsmall) var(--spacing-small);
     font-size: var(--font-size-xsmall);
     These are smaller than footer-button. If this distinction is important, these need to be uncommented.
     For now, relying on .button-base and global .imagefile-button from _components.css (if any)
  */
}

/* .imagefile-button--delete is styled in _components.css */

</style>
