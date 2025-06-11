<script setup>
import BaseInput from '../common/BaseInput.vue';
import { AioniaGameData } from '../../data/gameData.js';
const props = defineProps({
  skills: Array,
});
const emit = defineEmits(['addExpert','removeExpert']);
const expertPlaceholder = (skill) =>
  skill.checked
    ? AioniaGameData.placeholderTexts.expertSkill
    : AioniaGameData.placeholderTexts.expertSkillDisabled;
</script>
<template>
  <div id="skills" class="skills">
    <div class="box-title">技能</div>
    <ul class="skills-list box-content list-reset">
      <li v-for="skill in skills" :key="skill.id" class="skill-list">
        <div class="skill-header">
          <input type="checkbox" :id="skill.id" v-model="skill.checked" />
          <label :for="skill.id" class="skill-name">{{ skill.name }}</label>
        </div>
        <div v-if="skill.canHaveExperts && skill.checked" class="experts-section">
          <ul class="expert-list list-reset">
            <li v-for="(expert, expIndex) in skill.experts" :key="expIndex" class="base-list-item">
              <div class="delete-button-wrapper">
                <button
                  type="button"
                  class="button-base list-button list-button--delete"
                  @click="emit('removeExpert', skill, expIndex)"
                  :disabled="skill.experts.length <= 1 && expert.value === ''"
                  aria-label="専門技能を削除"
                >－</button>
              </div>
              <BaseInput
                v-model="expert.value"
                type="text"
                :placeholder="expertPlaceholder(skill)"
                :disabled="!skill.checked"
                class="flex-grow"
              />
            </li>
          </ul>
          <div class="add-button-container-left">
            <button
              type="button"
              class="button-base list-button list-button--add"
              @click="emit('addExpert', skill)"
              aria-label="専門技能を追加"
            >＋</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
