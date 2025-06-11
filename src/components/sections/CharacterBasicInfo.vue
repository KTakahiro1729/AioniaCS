<template>
  <div id="character_info" class="character-info">
    <div class="box-title">基本情報</div>
    <div class="box-content">
      <CharacterImageDisplay v-model:images="character.images" />
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">キャラクター名</label>
          <input type="text" id="name" v-model="character.name" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">プレイヤー名</label>
          <input type="text" id="player_name" v-model="character.playerName" />
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
          <input type="text" id="rare_species" v-model="character.rareSpecies" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--quadruple">
          <label for="gender">性別</label>
          <input type="text" id="gender" v-model="character.gender" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="age">年齢</label>
          <input type="number" id="age" v-model.number="character.age" min="0" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="height">身長</label>
          <input type="text" id="height" v-model="character.height" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="weight_char">体重</label>
          <input type="text" id="weight_char" v-model="character.weight" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--triple">
          <label for="origin">出身地</label>
          <input type="text" id="origin" v-model="character.origin" />
        </div>
        <div class="info-item info-item--triple">
          <label for="occupation">職業</label>
          <input type="text" id="occupation" v-model="character.occupation" />
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
import CharacterImageDisplay from '../ui/CharacterImageDisplay.vue';
import { AioniaGameData } from '../../data/gameData.js';

const character = defineModel('character');

const handleSpeciesChange = () => {
  if (character.value.species !== 'other') {
    character.value.rareSpecies = '';
  }
};
</script>

<style scoped>
</style>

