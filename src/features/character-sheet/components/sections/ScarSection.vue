<template>
  <div id="scar_section" class="scar">
    <div class="box-title">{{ scarTexts.title }}</div>
    <div class="box-content scar-section">
      <div class="info-row">
        <div class="info-item info-item--double">
          <label for="initial_scar">{{ scarTexts.fields.initial }}</label>
          <input
            type="number"
            id="initial_scar"
            v-model.number="characterStore.character.initialScar"
            min="0"
            :disabled="uiStore.isViewingShared"
          />
        </div>
        <div class="info-item info-item--double">
          <label for="current_scar" class="link-checkbox-main-label">{{ scarTexts.fields.current }}</label>
          <input
            type="number"
            id="current_scar"
            :value="calculatedScar"
            min="0"
            class="scar-section__current-input scar-section__current-input--readonly"
            disabled
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/locales/ja.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const scarTexts = messages.sheet.sections.scar;
const calculatedScar = computed(() => characterStore.calculatedScar);
</script>

<style scoped>
.link-checkbox-main-label {
  margin-right: 8px;
}

.scar-section__current-input--readonly {
  background-color: var(--color-input-disabled-bg);
  color: var(--color-text-normal);
}
</style>
