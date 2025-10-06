<template>
  <div id="items_section" class="items">
    <div class="box-title">
      <div class="box-title-main">
        <span class="box-title-text">所持品</span>
        <label class="description-toggle">
          <input type="checkbox" v-model="uiStore.showItemDescriptions" />
          説明を表示
        </label>
      </div>
      <LoadIndicator />
    </div>

    <div class="box-content">
      <div class="equipment-wrapper">
        <div class="equipment-container">
          <div class="equipment-section">
            <div class="equipment-item" v-for="slot in equipmentSlots" :key="slot.key">
              <label :for="slot.key">{{ slot.label }}</label>
              <div class="flex-group">
                <select
                  :id="slot.key"
                  v-model="characterStore.equipments[slot.key].group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                  :title="equipmentDescriptions[slot.key]"
                >
                  <option
                    v-for="option in gameData[slot.optionsKey]"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <input
                  type="text"
                  :id="`${slot.key}_name`"
                  v-model="characterStore.equipments[slot.key].name"
                  :placeholder="gameData.placeholderTexts[slot.placeholderKey]"
                  class="flex-item-2"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <textarea
                v-if="uiStore.showItemDescriptions && equipmentDescriptions[slot.key]"
                class="equipment-description"
                :value="equipmentDescriptions[slot.key]"
                readonly
              ></textarea>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="other_items" class="block-label">その他所持品</label>
        <textarea
          id="other_items"
          class="items-textarea"
          v-model="characterStore.character.otherItems"
          :readonly="uiStore.isViewingShared"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AioniaGameData as gameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import LoadIndicator from '../ui/LoadIndicator.vue';

const characterStore = useCharacterStore();
const uiStore = useUiStore();

const equipmentSlots = [
  { key: 'weapon1', label: '武器1', optionsKey: 'weaponOptions', placeholderKey: 'weaponName' },
  { key: 'weapon2', label: '武器2', optionsKey: 'weaponOptions', placeholderKey: 'weaponName' },
  { key: 'armor', label: '防具', optionsKey: 'armorOptions', placeholderKey: 'armorName' },
];

const optionDescriptionMaps = computed(() =>
  equipmentSlots.reduce((maps, slot) => {
    if (!maps[slot.optionsKey]) {
      maps[slot.optionsKey] = (gameData[slot.optionsKey] || []).reduce((acc, option) => {
        acc[option.value] = option.description || '';
        return acc;
      }, {});
    }
    return maps;
  }, {}),
);

const equipmentDescriptions = computed(() => {
  const maps = optionDescriptionMaps.value;

  return equipmentSlots.reduce((descriptions, slot) => {
    const equipment = characterStore.equipments[slot.key];
    const group = equipment?.group;
    const optionMap = maps[slot.optionsKey] || {};

    descriptions[slot.key] = (group && optionMap[group]) || '';

    return descriptions;
  }, {});
});
</script>

<style scoped>
.equipment-wrapper {
  margin-bottom: 15px;
}

.equipment-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.equipment-section {
  flex: 1 1 300px;
  min-width: 280px;
}

.equipment-item {
  margin-bottom: 12px;
}

.equipment-item:last-child {
  margin-bottom: 0;
}

/* アイテム用テキストエリア */
.items-textarea {
  min-height: 100px;
  resize: vertical;
}

.equipment-description {
  margin-top: 6px;
  min-height: 45px;
  resize: vertical;
}

.description-toggle {
  display: inline-flex;
  align-items: center;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 0.8em;
}
</style>
