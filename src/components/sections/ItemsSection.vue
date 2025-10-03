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
            <div class="equipment-item">
              <label for="weapon1">武器1</label>
              <div class="flex-group">
                <select
                  id="weapon1"
                  v-model="characterStore.equipments.weapon1.group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                  :title="weapon1Description"
                >
                  <option v-for="option in gameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="weapon1_name"
                  v-model="characterStore.equipments.weapon1.name"
                  :placeholder="gameData.placeholderTexts.weaponName"
                  class="flex-item-2"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <textarea
                v-if="uiStore.showItemDescriptions && weapon1Description"
                class="equipment-description"
                :value="weapon1Description"
                readonly
              ></textarea>
            </div>
            <div class="equipment-item">
              <label for="weapon2">武器2</label>
              <div class="flex-group">
                <select
                  id="weapon2"
                  v-model="characterStore.equipments.weapon2.group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                  :title="weapon2Description"
                >
                  <option v-for="option in gameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="weapon2_name"
                  v-model="characterStore.equipments.weapon2.name"
                  :placeholder="gameData.placeholderTexts.weaponName"
                  class="flex-item-2"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <textarea
                v-if="uiStore.showItemDescriptions && weapon2Description"
                class="equipment-description"
                :value="weapon2Description"
                readonly
              ></textarea>
            </div>
            <div class="equipment-item">
              <label for="armor">防具</label>
              <div class="flex-group">
                <select
                  id="armor"
                  v-model="characterStore.equipments.armor.group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                  :title="armorDescription"
                >
                  <option v-for="option in gameData.armorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="armor_name"
                  v-model="characterStore.equipments.armor.name"
                  :placeholder="gameData.placeholderTexts.armorName"
                  class="flex-item-2"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <textarea
                v-if="uiStore.showItemDescriptions && armorDescription"
                class="equipment-description"
                :value="armorDescription"
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

const weaponDescriptions = computed(() =>
  gameData.weaponOptions.reduce((acc, option) => {
    acc[option.value] = option.description || '';
    return acc;
  }, {})
);

const armorDescriptions = computed(() =>
  gameData.armorOptions.reduce((acc, option) => {
    acc[option.value] = option.description || '';
    return acc;
  }, {})
);

const weapon1Description = computed(
  () => weaponDescriptions.value[characterStore.equipments.weapon1.group] || ''
);

const weapon2Description = computed(
  () => weaponDescriptions.value[characterStore.equipments.weapon2.group] || ''
);

const armorDescription = computed(
  () => armorDescriptions.value[characterStore.equipments.armor.group] || ''
);
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

.box-title-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.description-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
}

.description-toggle input[type='checkbox'] {
  accent-color: var(--color-accent-primary);
}
</style>
