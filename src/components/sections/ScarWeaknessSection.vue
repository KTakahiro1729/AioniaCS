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
                v-model="character.linkCurrentToInitialScar"
                class="link-checkbox"
              />
              <label for="link_current_to_initial_scar_checkbox" class="link-checkbox-label">連動</label>
            </div>
            <input
              type="number"
              id="current_scar"
              v-model.number="character.currentScar"
              @input="handleCurrentScarInput"
              :class="{ 'greyed-out': character.linkCurrentToInitialScar }"
              min="0"
              class="scar-section__current-input"
            />
          </div>
          <div class="info-item info-item--double">
            <label for="initial_scar">初期値</label>
            <input type="number" id="initial_scar" v-model.number="character.initialScar" min="0" />
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
          <li v-for="(weakness, index) in character.weaknesses" :key="index" class="base-list-item">
            <div class="flex-weakness-number">{{ index + 1 }}</div>
            <div class="flex-weakness-text">
              <input type="text" v-model="weakness.text" />
            </div>
            <div class="flex-weakness-acquired">
              <select v-model="weakness.acquired">
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
import { watch } from 'vue';

const props = defineProps({
  character: { type: Object, required: true },
  sessionNames: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:character']);

watch(
  () => props.character,
  (val) => emit('update:character', val),
  { deep: true }
);

function handleCurrentScarInput(event) {
  const enteredValue = parseInt(event.target.value, 10);
  if (Number.isNaN(enteredValue)) return;
  if (props.character.linkCurrentToInitialScar && enteredValue !== props.character.initialScar) {
    props.character.linkCurrentToInitialScar = false;
  }
}
</script>

<style scoped>
</style>
