<script setup>
import CharacterImageDisplay from '../ui/CharacterImageDisplay.vue';
import BaseInput from '../common/BaseInput.vue';
import BaseSelect from '../common/BaseSelect.vue';
import { AioniaGameData } from '../../data/gameData.js';
const props = defineProps({
  character: Object,
  images: Array,
  currentImageIndex: Number,
});
const emit = defineEmits(['previousImage','nextImage','uploadImage','deleteImage','speciesChange']);
</script>
<template>
  <div id="character_info" class="character-info">
    <div class="box-title">基本情報</div>
    <div class="box-content">
      <CharacterImageDisplay
        :images="images"
        :currentIndex="currentImageIndex"
        @previous="emit('previousImage')"
        @next="emit('nextImage')"
        @upload="(e) => emit('uploadImage', e)"
        @delete="emit('deleteImage')"
      />
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">キャラクター名</label>
          <BaseInput id="name" v-model="character.name" type="text" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">プレイヤー名</label>
          <input id="player_name" v-model="character.playerName" type="text" />
        </div>
      </div>
      <div class="info-row">
        <div
          class="info-item"
          :class="{
            'info-item--full': character.species !== 'other',
            'info-item--double': character.species === 'other',
          }"
        >
          <label for="species">種族</label>
          <BaseSelect id="species" v-model="character.species" @change="emit('speciesChange')">
            <option
              v-for="option in AioniaGameData.speciesOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >{{ option.label }}</option>
          </BaseSelect>
        </div>
        <div class="info-item info-item--double" v-if="character.species === 'other'">
          <label for="rare_species">種族名（希少人種）</label>
          <input id="rare_species" v-model="character.rareSpecies" type="text" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--quadruple">
          <label for="gender">性別</label>
          <input id="gender" v-model="character.gender" type="text" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="age">年齢</label>
          <input id="age" v-model.number="character.age" type="number" min="0" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="height">身長</label>
          <input id="height" v-model="character.height" type="text" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="weight_char">体重</label>
          <input id="weight_char" v-model="character.weight" type="text" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--triple">
          <label for="origin">出身地</label>
          <input id="origin" v-model="character.origin" type="text" />
        </div>
        <div class="info-item info-item--triple">
          <label for="occupation">職業</label>
          <input id="occupation" v-model="character.occupation" type="text" />
        </div>
        <div class="info-item info-item--triple">
          <label for="faith">信仰</label>
          <input id="faith" v-model="character.faith" type="text" />
        </div>
      </div>
    </div>
  </div>
</template>
