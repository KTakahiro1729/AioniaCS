<template>
  <div class="items">
    <div class="box-title">所持品</div>
    <div class="box-content">
      <div class="equipment-wrapper">
        <div class="equipment-container">
          <div class="equipment-section">
            <div class="equipment-item">
              <label for="weapon1_is">武器1</label>
              <div class="flex-group">
                <select id="weapon1_is" v-model="localEquipments.weapon1.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="weapon1_name_is" v-model="localEquipments.weapon1.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
              </div>
            </div>
            <div class="equipment-item">
              <label for="weapon2_is">武器2</label>
              <div class="flex-group">
                <select id="weapon2_is" v-model="localEquipments.weapon2.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.weaponOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="weapon2_name_is" v-model="localEquipments.weapon2.name" :placeholder="AioniaGameData.placeholderTexts.weaponName" class="flex-item-2"/>
              </div>
            </div>
            <div class="equipment-item">
              <label for="armor_is">防具</label>
              <div class="flex-group">
                <select id="armor_is" v-model="localEquipments.armor.group" class="flex-item-1">
                  <option v-for="option in AioniaGameData.armorOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <input type="text" id="armor_name_is" v-model="localEquipments.armor.name" :placeholder="AioniaGameData.placeholderTexts.armorName" class="flex-item-2"/>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="other_items_is" class="block-label">その他所持品</label>
        <textarea id="other_items_is" class="items-textarea" v-model="localOtherItemsString"></textarea>
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

const localEquipments = reactive(JSON.parse(JSON.stringify(props.equipments)));
const localOtherItemsString = ref(props.characterOtherItems);

watch(() => props.equipments, (newVal) => {
  Object.assign(localEquipments, JSON.parse(JSON.stringify(newVal)));
}, { deep: true });

watch(() => props.characterOtherItems, (newVal) => {
  if (localOtherItemsString.value !== newVal) {
    localOtherItemsString.value = newVal;
  }
});

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
/* .items (root) is styled by _layout.css (grid-area) */
/* .box-title, .box-content are styled by _components.css */
/* label, select, input[type="text"], textarea base styles are from _components.css */
/* .flex-group, .flex-item-1, .flex-item-2 are styled by _layout.css */
/* .block-label is styled by _layout.css */

/* Styles moved from _sections.css */
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
  /* Note: The original scoped style for ItemsSection had .equipment-section as a flex column.
     The version from _sections.css makes it a flex item.
     The internal structure of .equipment-item will stack label and flex-group vertically.
     And multiple .equipment-item will stack due to block layout or if .equipment-section is made flex column.
     For now, using the _sections.css definition.
  */
}

.equipment-item {
  margin-bottom: 12px;
  /* The original scoped style had:
    display: flex; flex-direction: column; gap: var(--spacing-xsmall);
    This is slightly different from just margin-bottom.
    If this precise flex layout is needed for label + input group, it might need to be reinstated.
    However, basic label (block by default or styled by global) above an input group (div) will stack naturally.
    The `gap` would be lost in favor of `margin-bottom` on the .equipment-item.
  */
}

.equipment-item:last-child {
  margin-bottom: 0;
}

.items-textarea { /* This class is on the textarea element itself */
  min-height: 100px; /* from _sections.css */
  resize: vertical; /* from _sections.css */
  /* Base textarea styles (width 100%, padding, border, font, colors, focus) come from _components.css */
}
/* End of styles moved from _sections.css */

</style>
