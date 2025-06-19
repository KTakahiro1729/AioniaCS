<template>
  <div id="scar_weakness_section" class="scar-weakness">
    <div class="box-title">傷痕と弱点</div>
    <div class="box-content">
      <div class="scar-section">
        <div class="sub-box-title sub-box-title--scar">傷痕</div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <div class="link-checkbox-container">
              <label for="current_scar" class="link-checkbox-main-label">現在値</label>
              <input
                type="checkbox"
                id="link_current_to_initial_scar_checkbox"
                v-model="characterStore.character.linkCurrentToInitialScar"
                class="link-checkbox"
                :disabled="uiStore.isViewingShared"
              />
              <label for="link_current_to_initial_scar_checkbox" class="link-checkbox-label">連動</label>
            </div>
            <input
              type="number"
              id="current_scar"
              v-model.number="characterStore.character.currentScar"
              @input="handleCurrentScarInput"
              :class="{ 'greyed-out': characterStore.character.linkCurrentToInitialScar }"
              min="0"
              class="scar-section__current-input"
              :disabled="uiStore.isViewingShared"
            />
          </div>
          <div class="info-item info-item--double">
            <label for="initial_scar">初期値</label>
            <input
              type="number"
              id="initial_scar"
              v-model.number="characterStore.character.initialScar"
              min="0"
              :disabled="uiStore.isViewingShared"
            />
          </div>
        </div>
      </div>
      <div class="weakness-section">
        <div class="sub-box-title sub-box-title--weakness">弱点</div>
        <ul class="weakness-list list-reset">
          <li class="base-list-header">
            <div class="flex-weakness-number base-list-header-placeholder"></div>
            <div class="flex-weakness-text"><label>弱点</label></div>
            <div class="flex-weakness-acquired"><label>獲得</label></div>
          </li>
          <li v-for="(weakness, index) in characterStore.character.weaknesses" :key="index" class="base-list-item">
            <div class="flex-weakness-number">{{ (index < 9) ? index + 1 : "X"}}</div>
            <div class="flex-weakness-text">
              <input type="text" v-model="weakness.text" :disabled="uiStore.isViewingShared" />
            </div>
            <div class="flex-weakness-acquired">
              <select v-model="weakness.acquired" :disabled="uiStore.isViewingShared">
                <option
                  v-for="option in sessionNames"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                >{{ option.text }}</option>
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
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const sessionNames = computed(() => characterStore.sessionNamesForWeaknessDropdown);

function handleCurrentScarInput(event) {
  const enteredValue = parseInt(event.target.value, 10);
  if (Number.isNaN(enteredValue)) return;
  if (
    characterStore.character.linkCurrentToInitialScar &&
    enteredValue !== characterStore.character.initialScar
  ) {
    characterStore.character.linkCurrentToInitialScar = false;
  }
}
</script>

<style scoped>
.scar-section {
  margin-bottom: 25px;
}

.link-checkbox-container {
  display: flex;
  align-items: center;
}

.link-checkbox-main-label {
  margin-right: 8px;
}

.link-checkbox {
  margin-right: 4px;
  margin-bottom: 2px;
  accent-color: var(--color-accent);
  transform: scale(1.1);
  width: auto;
}

.link-checkbox-label {
  font-size: 0.9em;
  color: var(--color-text-muted);
  font-weight: normal;
  user-select: none;
  margin-bottom: 0;
}

.sub-box-title--scar {
  margin-top: -18px;
  margin-bottom: 15px;
}

.sub-box-title--weakness {
  margin-top: 0;
  margin-bottom: 10px;
  border-top: 1px solid var(--color-border-normal);
}

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
  font-family: "Noto Serif JP", serif;
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
