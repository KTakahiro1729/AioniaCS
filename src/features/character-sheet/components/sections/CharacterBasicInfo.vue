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
            list="species-options"
            v-model="speciesDisplayValue"
            :disabled="uiStore.isViewingShared"
            @change="handleSpeciesInput"
          />
          <datalist id="species-options">
            <option v-for="option in speciesComboOptions" :key="option.value" :value="option.label"></option>
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
          <label for="build">{{ basicInfoTexts.fields.build }}</label>
          <input type="text" id="build" v-model="characterStore.character.build" :disabled="uiStore.isViewingShared" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CharacterImageDisplay from '@/features/character-sheet/components/ui/CharacterImageDisplay.vue';
import { AioniaGameData } from '@/data/gameData.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/i18n/index.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const basicInfoTexts = messages.sheet.sections.basicInfo;

const speciesComboOptions = computed(() =>
  AioniaGameData.speciesOptions.filter((o) => !o.disabled && o.value),
);

function getDisplayForSpecies(species, rareSpecies) {
  if (!species) return '';
  if (species === 'other') return rareSpecies || '';
  const found = AioniaGameData.speciesOptions.find((o) => o.value === species);
  return found ? found.label : species;
}

const speciesDisplayValue = ref(
  getDisplayForSpecies(characterStore.character.species, characterStore.character.rareSpecies),
);

watch(
  () => [characterStore.character.species, characterStore.character.rareSpecies],
  ([species, rareSpecies]) => {
    speciesDisplayValue.value = getDisplayForSpecies(species, rareSpecies);
  },
);

function handleSpeciesInput(event) {
  const inputValue = event.target.value.trim();
  const matchedOption = AioniaGameData.speciesOptions.find(
    (o) => o.label === inputValue && !o.disabled && o.value,
  );
  if (matchedOption) {
    characterStore.character.species = matchedOption.value;
    characterStore.character.rareSpecies = '';
  } else {
    characterStore.character.species = 'other';
    characterStore.character.rareSpecies = inputValue;
  }
}
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
