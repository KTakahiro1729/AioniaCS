<template>
  <div id="scar_weakness_section" class="scar-weakness">
    <div class="box-title">{{ scarWeaknessTexts.title }}</div>
    <div class="box-content">
      <div class="scar-section">
        <div class="sub-box-title sub-box-title--scar">{{ scarWeaknessTexts.scar.title }}</div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <label for="initial_scar">{{ scarWeaknessTexts.scar.initial }}</label>
            <input
              type="number"
              id="initial_scar"
              v-model.number="characterStore.character.initialScar"
              min="0"
              :disabled="uiStore.isViewingShared"
            />
          </div>
          <div class="info-item info-item--double">
            <label for="current_scar" class="link-checkbox-main-label">{{ scarWeaknessTexts.scar.current }}</label>
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
      <div class="weakness-section">
        <div class="sub-box-title sub-box-title--weakness">{{ scarWeaknessTexts.weakness.title }}</div>
        <ul class="weakness-list list-reset">
          <li class="base-list-header">
            <div class="flex-weakness-number base-list-header-placeholder"></div>
            <div class="flex-weakness-text"><label>{{ scarWeaknessTexts.weakness.columns.text }}</label></div>
            <div class="flex-weakness-acquired"><label>{{ scarWeaknessTexts.weakness.columns.acquired }}</label></div>
          </li>
          <li v-for="(weakness, index) in characterStore.character.weaknesses" :key="index" class="base-list-item">
            <div class="flex-weakness-number">{{ index < 9 ? index + 1 : 'X' }}</div>
            <div class="flex-weakness-text">
              <input type="text" v-model="weakness.text" :disabled="uiStore.isViewingShared" />
            </div>
            <div class="flex-weakness-acquired">
              <select v-model="weakness.acquired" :disabled="uiStore.isViewingShared">
                <option v-for="option in sessionNames" :key="option.value" :value="option.value" :disabled="option.disabled">
                  {{ option.text }}
                </option>
              </select>
            </div>
          </li>
        </ul>
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
const scarWeaknessTexts = messages.sheet.sections.scarWeakness;
const sessionNames = computed(() => characterStore.sessionNamesForWeaknessDropdown);
const calculatedScar = computed(() => characterStore.calculatedScar);
</script>

<style scoped>
.box-content {
  padding-top: 0;
}

.scar-section {
  margin-bottom: 25px;
}

.link-checkbox-main-label {
  margin-right: 8px;
}

.scar-section__current-input--readonly {
  background-color: var(--color-input-disabled-bg);
  color: var(--color-text-normal);
}

.sub-box-title--weakness {
  border-top: 1px solid var(--color-border-normal);
}

/* 弱点リスト */
.weakness-list .base-list-item {
  font-size: 0.9em;
  align-items: center;
}

.weakness-labels-header {
  color: var(--color-text-muted);
}

.weakness-labels-header .flex-weakness-number {
  color: transparent;
  user-select: none;
}

.flex-weakness-number {
  font-family: 'Cinzel Decorative', serif;
  color: var(--color-accent);
  font-weight: 700;
  width: 20px;
  text-align: center;
}

.flex-weakness-text {
  flex: 1;
}

.flex-weakness-acquired {
  width: 150px;
}

.flex-weakness-acquired option[disabled] {
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
