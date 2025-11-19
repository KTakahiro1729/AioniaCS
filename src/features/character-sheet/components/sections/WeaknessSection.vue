<template>
  <div id="weakness_section" class="weakness">
    <div class="box-title">{{ weaknessTexts.title }}</div>
    <div class="box-content">
      <ul class="weakness-list list-reset">
        <li class="base-list-header">
          <div class="flex-weakness-number base-list-header-placeholder"></div>
          <div class="flex-weakness-text">
            <label>{{ weaknessTexts.columns.text }}</label>
          </div>
          <div class="flex-weakness-acquired">
            <label>{{ weaknessTexts.columns.acquired }}</label>
          </div>
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
</template>

<script setup>
import { computed } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/locales/ja.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const weaknessTexts = messages.sheet.sections.weakness;
const sessionNames = computed(() => characterStore.sessionNamesForWeaknessDropdown);
</script>

<style scoped>
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
