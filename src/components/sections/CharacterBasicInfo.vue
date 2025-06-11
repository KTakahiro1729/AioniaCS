<template>
  <div id="character_info" class="character-info">
    <div class="box-title">基本情報</div>
    <div class="box-content">
      <CharacterImageDisplay v-model:images="characterStore.character.images" />
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">キャラクター名</label>
          <input type="text" id="name" v-model="characterStore.character.name" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">プレイヤー名</label>
          <input type="text" id="player_name" v-model="characterStore.character.playerName" />
        </div>
      </div>
      <div class="info-row">
        <div
          class="info-item"
          :class="{
            'info-item--full': characterStore.character.species !== 'other',
            'info-item--double': characterStore.character.species === 'other',
          }"
        >
          <label for="species">種族</label>
          <select id="species" v-model="characterStore.character.species" @change="handleSpeciesChange">
            <option
              v-for="option in AioniaGameData.speciesOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >{{ option.label }}</option>
          </select>
        </div>
        <div class="info-item info-item--double" v-if="characterStore.character.species === 'other'">
          <label for="rare_species">種族名（希少人種）</label>
          <input type="text" id="rare_species" v-model="characterStore.character.rareSpecies" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--quadruple">
          <label for="gender">性別</label>
          <input type="text" id="gender" v-model="characterStore.character.gender" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="age">年齢</label>
          <input
            type="number"
            id="age"
            :value="characterStore.character.age"
            @input="
              (e) => {
                const v = e.target.value;
                characterStore.character.age = v === '' ? null : parseInt(v, 10);
              }
            "
            min="0"
          />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="height">身長</label>
          <input type="text" id="height" v-model="characterStore.character.height" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="weight_char">体重</label>
          <input type="text" id="weight_char" v-model="characterStore.character.weight" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--triple">
          <label for="origin">出身地</label>
          <input type="text" id="origin" v-model="characterStore.character.origin" />
        </div>
        <div class="info-item info-item--triple">
          <label for="occupation">職業</label>
          <input type="text" id="occupation" v-model="characterStore.character.occupation" />
        </div>
        <div class="info-item info-item--triple">
          <label for="faith">信仰</label>
          <input type="text" id="faith" v-model="characterStore.character.faith" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CharacterImageDisplay from '../ui/CharacterImageDisplay.vue';
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';

const characterStore = useCharacterStore();

const handleSpeciesChange = () => {
  characterStore.handleSpeciesChange();
};
</script>

<style scoped>
</style>

