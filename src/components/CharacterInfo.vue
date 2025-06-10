<template>
  <div id="character_info" class="character-info">
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
import { AioniaGameData } from '../data/gameData.js'; // Adjusted path
import { ImageManager } from '../services/imageManager.js'; // Adjusted path

const props = defineProps({
  character: Object, // Main character data object
  // AioniaGameData will be imported directly, not passed as a prop initially
});

const emit = defineEmits(['update:character', 'image-updated']); // Example emits

const currentImageIndex = ref(0); // Start with 0, assuming images array won't be empty if used

// Computed property for the current image source
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

// Methods related to character info
const handleSpeciesChange = () => {
  const newCharacter = { ...props.character };
  if (newCharacter.species !== "other") {
    newCharacter.rareSpecies = "";
  }
  emit('update:character', newCharacter);
};

const showCustomAlert = (message) => alert(message); // Placeholder for now

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  // Assuming ImageManager is correctly imported and available
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
    emit('image-updated'); // Inform parent about image changes if needed
  } catch (error) {
    console.error("Error loading image:", error);
    showCustomAlert("画像の読み込みに失敗しました：" + error.message);
  } finally {
    event.target.value = null; // Reset file input
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
      currentImageIndex.value = -1; // Or 0, depending on desired behavior for no images
    } else if (currentImageIndex.value >= newCharacter.images.length) {
      currentImageIndex.value = newCharacter.images.length - 1;
    }
    emit('update:character', newCharacter);
    emit('image-updated');
  }
};

// Watch for changes in character.images from parent to reset index if needed
// This might be necessary if images are modified externally
// watch(() => props.character.images, (newImages) => {
//   if (newImages && newImages.length > 0 && currentImageIndex.value >= newImages.length) {
//     currentImageIndex.value = newImages.length - 1;
//   } else if (!newImages || newImages.length === 0) {
//     currentImageIndex.value = 0; // Or -1
//   }
// }, { deep: true });

</script>

<style scoped>
/* Copied from App.vue - specific to #character_info */
.character-info {
  grid-area: character-info; /* Assigns this component to the 'character-info' grid area */
  /* Styles specific to the character info box itself */
}

.character-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-medium);
  width: 100%; /* Ensure it takes full width of its parent */
}

.image-display-area {
  width: var(--image-display-width, 200px); /* Default width, can be overridden by CSS variables */
  height: var(--image-display-height, 200px); /* Default height */
  background-color: var(--color-background-image-placeholder);
  border: 1px solid var(--color-border-default);
  border-radius: var(--border-radius-default);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative; /* For positioning navigation buttons */
  overflow: hidden; /* Ensures image doesn't spill out */
  margin-bottom: var(--spacing-small);
}

.image-display-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.character-image-display {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Scales image to fit within bounds, maintaining aspect ratio */
}

.character-image-placeholder {
  color: var(--color-text-placeholder);
  font-size: var(--font-size-small);
}

.button-imagenav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  padding: var(--spacing-small) var(--spacing-xsmall);
  cursor: pointer;
  z-index: 10;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-large);
}
.button-imagenav:hover {
  background-color: rgba(0, 0, 0, 0.5);
}
.button-imagenav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-imagenav--prev {
  left: var(--spacing-xsmall);
}

.button-imagenav--next {
  right: var(--spacing-xsmall);
}

.image-count-display {
  position: absolute;
  bottom: var(--spacing-xsmall);
  right: var(--spacing-xsmall);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px var(--spacing-xsmall);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-xsmall);
}


.image-controls {
  display: flex;
  justify-content: center; /* Center buttons horizontally */
  gap: var(--spacing-small); /* Space between buttons */
  width: 100%; /* Make control bar take full width */
  margin-top: var(--spacing-xsmall);
}

.imagefile-button {
  padding: var(--spacing-xsmall) var(--spacing-small);
  font-size: var(--font-size-xsmall);
  /* Additional styling for upload/delete buttons if needed */
}
.imagefile-button--upload {
  /* Specific styles for upload */
}
.imagefile-button--delete {
  /* Specific styles for delete */
  background-color: var(--color-button-danger-bg);
}
.imagefile-button--delete:hover {
  background-color: var(--color-button-danger-hover-bg);
}
.imagefile-button--delete:disabled {
  background-color: var(--color-button-disabled-bg);
  border-color: var(--color-button-disabled-border);
  color: var(--color-button-disabled-text);
  cursor: not-allowed;
}


/* General info layout */
.info-row {
  display: flex;
  gap: var(--spacing-medium); /* Spacing between items in a row */
  margin-bottom: var(--spacing-medium);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xsmall); /* Spacing between label and input */
}

/* Variations for item widths */
.info-item--full { flex-basis: 100%; }
.info-item--double { flex-basis: calc(50% - var(--spacing-medium) / 2); }
.info-item--triple { flex-basis: calc(33.333% - var(--spacing-medium) * 2 / 3); }
.info-item--quadruple { flex-basis: calc(25% - var(--spacing-medium) * 3 / 4); }

.info-item label {
  font-size: var(--font-size-small);
  color: var(--color-text-label);
  margin-bottom: 0; /* Adjust if needed */
}

.info-item input[type="text"],
.info-item input[type="number"],
.info-item select {
  width: 100%; /* Make inputs fill their container */
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box; /* Include padding and border in element's total width and height */
}
.info-item input:focus, .info-item select:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}

/* Ensure consistent height for inputs and selects if they are side-by-side */
.info-row input[type="text"],
.info-row input[type="number"],
.info-row select {
  height: var(--input-height-base); /* Define this in _variables.css */
}

</style>
