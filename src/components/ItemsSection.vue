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
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="weapon1_name" v-model="localEquipments.weapon1.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
              </div>
            </div>
            <div class="equipment-item">
              <label for="weapon2">武器2</label>
              <div class="flex-group">
                <select id="weapon2" v-model="localEquipments.weapon2.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="weapon2_name" v-model="localEquipments.weapon2.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
              </div>
            </div>
            <div class="equipment-item">
              <label for="armor">防具</label>
              <div class="flex-group">
                <select id="armor" v-model="localEquipments.armor.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.armorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="armor_name" v-model="localEquipments.armor.name" :placeholder="AioniaGameData.placeholderTexts.armorName" class="flex-item-2"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="other_items" class="block-label">その他所持品</label>
        <textarea id="other_items" class="items-textarea" v-model="localOtherItemsString"></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, ref, watch } from 'vue';

const props = defineProps({
  equipments: {
    type: Object,
    required: true,
  },
  characterOtherItems: {
    type: String,
    required: true,
  },
  AioniaGameData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  'update:equipments',
  'update:characterOtherItems',
  'items-changed'
]);

// Local reactive copy for equipments object
const localEquipments = reactive(JSON.parse(JSON.stringify(props.equipments)));

// Local ref for characterOtherItems string
const localOtherItemsString = ref(props.characterOtherItems);

// Watchers for prop changes to update local copies
watch(() => props.equipments, (newVal) => {
  Object.assign(localEquipments, JSON.parse(JSON.stringify(newVal)));
}, { deep: true });

watch(() => props.characterOtherItems, (newVal) => {
  if (localOtherItemsString.value !== newVal) {
    localOtherItemsString.value = newVal;
  }
});

// Watchers for local changes to emit updates
watch(localEquipments, (newVal) => {
  emit('update:equipments', JSON.parse(JSON.stringify(newVal)));
  emit('items-changed');
}, { deep: true });

watch(localOtherItemsString, (newVal) => {
  emit('update:characterOtherItems', newVal);
  emit('items-changed');
});

</script>

<style scoped>
/* Styles specific to #items_section */
.items {
  grid-area: items; /* Assigns this component to the 'items' grid area */
}

.equipment-wrapper {
  margin-bottom: var(--spacing-medium);
}

.equipment-container {
  /* Existing styles if any, or new ones */
}

.equipment-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-medium); /* Space between each equipment item (Weapon1, Weapon2, Armor) */
}

.equipment-item {
  display: flex;
  flex-direction: column; /* Label above the input group */
  gap: var(--spacing-xsmall);
}

.equipment-item label { /* Style for "武器1", "武器2", "防具" */
  font-size: var(--font-size-small);
  color: var(--color-text-label);
  margin-bottom: 0; /* Reset default margin if any */
}

.flex-group { /* Container for select and text input */
  display: flex;
  gap: var(--spacing-small);
}

.flex-item-1 { /* For select */
  flex: 1;
}

.flex-item-2 { /* For text input */
  flex: 2;
}

.equipment-section select,
.equipment-section input[type="text"] {
  width: 100%; /* Make them fill their flex item container */
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box;
  height: var(--input-height-base); /* Consistent height */
}

.equipment-section select:focus,
.equipment-section input[type="text"]:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}

.block-label { /* For "その他所持品" */
  display: block; /* Make label take full width */
  font-size: var(--font-size-small);
  color: var(--color-text-label);
  margin-bottom: var(--spacing-xsmall);
}

.items-textarea {
  width: 100%;
  min-height: var(--textarea-min-height, 100px); /* Or specific height like 5em */
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box;
  resize: vertical; /* Allow vertical resize */
}

.items-textarea:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}
</style>
