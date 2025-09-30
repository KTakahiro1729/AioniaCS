<template>
  <div id="scar_weakness_section" class="scar-weakness">
    <div class="box-title">傷痕と弱点</div>
    <div class="box-content">
      <div class="scar-section">
        <div class="sub-box-title sub-box-title--scar">傷痕</div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <label for="current_scar">現在値</label>
            <span id="current_scar" class="scar-section__current-value">{{ characterStore.calculatedScar }}</span>
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
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const sessionNames = computed(() => characterStore.sessionNamesForWeaknessDropdown);
</script>

<style scoped>
.box-content {
  padding-top: 0;
}

.scar-section {
  margin-bottom: 25px;
}

.scar-section__current-value {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--color-border-normal);
  border-radius: 4px;
  background: var(--color-surface-elevated);
  color: var(--color-text-normal);
  font-variant-numeric: tabular-nums;
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
