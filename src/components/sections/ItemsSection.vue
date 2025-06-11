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
                <select id="weapon1" v-model="localEquipments.weapon1.group" class="flex-item-1">
                  <option
                    v-for="option in gameData.weaponOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="weapon1_name"
                  v-model="localEquipments.weapon1.name"
                  :placeholder="gameData.placeholderTexts.weaponName"
                  class="flex-item-2"
                />
              </div>
            </div>
            <div class="equipment-item">
              <label for="weapon2">武器2</label>
              <div class="flex-group">
                <select id="weapon2" v-model="localEquipments.weapon2.group" class="flex-item-1">
                  <option
                    v-for="option in gameData.weaponOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="weapon2_name"
                  v-model="localEquipments.weapon2.name"
                  :placeholder="gameData.placeholderTexts.weaponName"
                  class="flex-item-2"
                />
              </div>
            </div>
            <div class="equipment-item">
              <label for="armor">防具</label>
              <div class="flex-group">
                <select id="armor" v-model="localEquipments.armor.group" class="flex-item-1">
                  <option
                    v-for="option in gameData.armorOptions"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
                </select>
                <input
                  type="text"
                  id="armor_name"
                  v-model="localEquipments.armor.name"
                  :placeholder="gameData.placeholderTexts.armorName"
                  class="flex-item-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="other_items" class="block-label">その他所持品</label>
        <textarea id="other_items" class="items-textarea" v-model="localOtherItems"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, reactive, ref } from 'vue'
import { AioniaGameData as gameData } from '../../data/gameData.js'

const props = defineProps({
  equipments: Object,
  otherItems: String
})

const emit = defineEmits(['update:equipments', 'update:otherItems'])

const localEquipments = reactive({
  weapon1: { group: '', name: '' },
  weapon2: { group: '', name: '' },
  armor: { group: '', name: '' }
})

Object.assign(localEquipments, props.equipments)
const localOtherItems = ref(props.otherItems)

watch(
  () => props.equipments,
  (val) => {
    Object.assign(localEquipments, val)
  }
)
watch(
  () => props.otherItems,
  (val) => {
    localOtherItems.value = val
  }
)

watch(
  localEquipments,
  (val) => {
    emit('update:equipments', val)
  },
  { deep: true }
)

watch(
  localOtherItems,
  (val) => {
    emit('update:otherItems', val)
  }
)
</script>
