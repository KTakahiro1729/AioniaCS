<script setup>
import BaseSelect from '../common/BaseSelect.vue';
import BaseInput from '../common/BaseInput.vue';
import { AioniaGameData } from '../../data/gameData.js';
const props = defineProps({
  specialSkills: Array,
});
const emit = defineEmits(['addSpecial','removeSpecial','updateOptions','updateNote']);
const availableNames = (index) =>
  props.specialSkills[index]
    ? AioniaGameData.specialSkillData[props.specialSkills[index].group] || []
    : [];
const showNote = (skill) => skill.showNote;
</script>
<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <ul class="list-reset special-skills-list">
        <li v-for="(specialSkill, index) in specialSkills" :key="index" class="base-list-item special-skill-item">
          <div class="delete-button-wrapper">
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="emit('removeSpecial', index)"
              :disabled="specialSkills.length <= 1 && !(specialSkill.group || specialSkill.name || specialSkill.note)"
              aria-label="特技を削除"
            >－</button>
          </div>
          <div class="flex-grow">
            <div class="flex-group">
              <BaseSelect v-model="specialSkill.group" @change="emit('updateOptions', index)" class="flex-item-1">
                <option v-for="option in AioniaGameData.specialSkillGroupOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </BaseSelect>
              <BaseSelect v-model="specialSkill.name" @change="emit('updateNote', index)" :disabled="!specialSkill.group" class="flex-item-2">
                <option value="">---</option>
                <option v-for="opt in availableNames(index)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </BaseSelect>
            </div>
            <BaseInput
              v-model="specialSkill.note"
              v-show="showNote(specialSkill)"
              type="text"
              class="special-skill-note-input"
              :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
            />
          </div>
        </li>
      </ul>
      <div class="add-button-container-left" v-if="specialSkills.length < AioniaGameData.config.maxSpecialSkills">
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="emit('addSpecial')"
          aria-label="特技を追加"
        >＋</button>
      </div>
    </div>
  </div>
</template>
