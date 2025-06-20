<template>
  <div id="items_section" class="items">
    <div class="box-title">所持品<LoadIndicator /></div>
    
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
                >
                  <option
                    v-for="option in gameData.weaponOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
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
            </div>
            <div class="equipment-item">
              <label for="weapon2">武器2</label>
              <div class="flex-group">
                <select
                  id="weapon2"
                  v-model="characterStore.equipments.weapon2.group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                >
                  <option
                    v-for="option in gameData.weaponOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
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
            </div>
            <div class="equipment-item">
              <label for="armor">防具</label>
              <div class="flex-group">
                <select
                  id="armor"
                  v-model="characterStore.equipments.armor.group"
                  class="flex-item-1"
                  :disabled="uiStore.isViewingShared"
                >
                  <option
                    v-for="option in gameData.armorOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
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
import { AioniaGameData as gameData } from '../../data/gameData.js'
import { useCharacterStore } from '../../stores/characterStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import LoadIndicator from '../ui/LoadIndicator.vue'

const characterStore = useCharacterStore()
const uiStore = useUiStore()
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

</style>