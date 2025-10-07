<template>
  <div id="character_info" class="character-info">
    <div class="box-title">{{ basicInfoTexts.title }}</div>
    <div class="box-content">
      <CharacterImageDisplay v-model:images="characterStore.character.images" />
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="name">{{ basicInfoTexts.fields.name }}</label>
          <input type="text" id="name" v-model="characterStore.character.name" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--double">
          <label for="player_name">{{ basicInfoTexts.fields.playerName }}</label>
          <input type="text" id="player_name" v-model="characterStore.character.playerName" :disabled="uiStore.isViewingShared" />
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
          <label for="species">{{ basicInfoTexts.fields.species }}</label>
          <select id="species" v-model="characterStore.character.species" @change="handleSpeciesChange" :disabled="uiStore.isViewingShared">
            <option v-for="option in AioniaGameData.speciesOptions" :key="option.value" :value="option.value" :disabled="option.disabled">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="info-item info-item--double" v-if="characterStore.character.species === 'other'">
          <label for="rare_species">{{ basicInfoTexts.fields.rareSpecies }}</label>
          <input type="text" id="rare_species" v-model="characterStore.character.rareSpecies" :disabled="uiStore.isViewingShared" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--quadruple">
          <label for="gender">{{ basicInfoTexts.fields.gender }}</label>
          <input type="text" id="gender" v-model="characterStore.character.gender" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="age">{{ basicInfoTexts.fields.age }}</label>
          <input type="number" id="age" v-model.number="characterStore.character.age" min="0" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="height">{{ basicInfoTexts.fields.height }}</label>
          <input type="text" id="height" v-model="characterStore.character.height" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--quadruple">
          <label for="weight_char">{{ basicInfoTexts.fields.weight }}</label>
          <input type="text" id="weight_char" v-model="characterStore.character.weight" :disabled="uiStore.isViewingShared" />
        </div>
      </div>
      <div class="info-row">
        <div class="info-item info-item--triple">
          <label for="origin">{{ basicInfoTexts.fields.origin }}</label>
          <input type="text" id="origin" v-model="characterStore.character.origin" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--triple">
          <label for="occupation">{{ basicInfoTexts.fields.occupation }}</label>
          <input type="text" id="occupation" v-model="characterStore.character.occupation" :disabled="uiStore.isViewingShared" />
        </div>
        <div class="info-item info-item--triple">
          <label for="faith">{{ basicInfoTexts.fields.faith }}</label>
          <input type="text" id="faith" v-model="characterStore.character.faith" :disabled="uiStore.isViewingShared" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CharacterImageDisplay from '../ui/CharacterImageDisplay.vue';
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { messages } from '../../locales/ja.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const basicInfoTexts = messages.sheet.sections.basicInfo;

const handleSpeciesChange = () => {
  characterStore.handleSpeciesChange();
};
</script>

<style scoped></style>
