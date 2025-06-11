<script setup>
import BaseSelect from '../common/BaseSelect.vue';
import BaseInput from '../common/BaseInput.vue';
import { AioniaGameData } from '../../data/gameData.js';
const props = defineProps({
  equipments: Object,
  character: Object,
});
</script>
<template>
  <div id="items_section" class="items">
    <div class="box-title">所持品</div>
    <div class="box-content">
      <div class="equipment-wrapper">
        <div class="equipment-container">
          <div class="equipment-section">
            <div class="equipment-item">
              <label for="weapon1">武器1</label>
              <div class="flex-group">
                <BaseSelect id="weapon1" v-model="equipments.weapon1.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </BaseSelect>
                <BaseInput id="weapon1_name" v-model="equipments.weapon1.name" class="flex-item-2" type="text" :placeholder="AioniaGameData.placeholderTexts.weaponName" />
              </div>
            </div>
            <div class="equipment-item">
              <label for="weapon2">武器2</label>
              <div class="flex-group">
                <BaseSelect id="weapon2" v-model="equipments.weapon2.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </BaseSelect>
                <BaseInput id="weapon2_name" v-model="equipments.weapon2.name" class="flex-item-2" type="text" :placeholder="AioniaGameData.placeholderTexts.weaponName" />
              </div>
            </div>
            <div class="equipment-item">
              <label for="armor">防具</label>
              <div class="flex-group">
                <BaseSelect id="armor" v-model="equipments.armor.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.armorOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </BaseSelect>
                <BaseInput id="armor_name" v-model="equipments.armor.name" class="flex-item-2" type="text" :placeholder="AioniaGameData.placeholderTexts.armorName" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="other_items" class="block-label">その他所持品</label>
        <textarea id="other_items" class="items-textarea" v-model="character.otherItems"></textarea>
      </div>
    </div>
  </div>
</template>
