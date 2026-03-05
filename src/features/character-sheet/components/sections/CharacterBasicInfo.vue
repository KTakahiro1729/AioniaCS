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
        <div class="info-item info-item--double">
          <label for="species">{{ basicInfoTexts.fields.species }}</label>
          <input
            type="text"
            id="species"
            v-model="characterStore.character.species"
            list="species_list"
            :disabled="uiStore.isViewingShared"
          />
          <datalist id="species_list">
            <option v-for="option in AioniaGameData.speciesOptions" :key="option.value" :value="option.label" />
          </datalist>
        </div>
        <div class="info-item info-item--double">
          <label for="occupation">{{ basicInfoTexts.fields.occupation }}</label>
          <input type="text" id="occupation" v-model="characterStore.character.occupation" :disabled="uiStore.isViewingShared" />
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
        <div class="info-item info-item--double">
          <label for="physique">{{ basicInfoTexts.fields.height }}</label>
          <input type="text" id="physique" v-model="characterStore.character.physique" :disabled="uiStore.isViewingShared" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CharacterImageDisplay from '@/features/character-sheet/components/ui/CharacterImageDisplay.vue';
import { AioniaGameData } from '@/data/gameData.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/i18n/index.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const basicInfoTexts = messages.sheet.sections.basicInfo;

const handleSpeciesChange = () => {
  characterStore.handleSpeciesChange();
};
</script>

<style scoped>
@media (min-width: 769px) {
  .character-info {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .character-info .box-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
  }
}
</style>
