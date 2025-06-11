<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <ul class="list-reset special-skills-list">
        <li
          v-for="(specialSkill, index) in localSpecialSkills"
          :key="index"
          class="base-list-item special-skill-item"
        >
          <div class="delete-button-wrapper">
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="removeSpecialSkill(index)"
              :disabled="localSpecialSkills.length <= 1 && !hasSpecialSkillContent(specialSkill)"
              aria-label="特技を削除"
            >－</button>
          </div>
          <div class="flex-grow">
            <div class="flex-group">
              <select
                v-model="specialSkill.group"
                @change="updateSpecialSkillOptions(index)"
                class="flex-item-1"
              >
                <option
                  v-for="option in AioniaGameData.specialSkillGroupOptions"
                  :key="option.value"
                  :value="option.value"
                >{{ option.label }}</option>
              </select>
              <select
                v-model="specialSkill.name"
                @change="updateSpecialSkillNoteVisibility(index)"
                :disabled="!specialSkill.group"
                class="flex-item-2"
              >
                <option value="">---</option>
                <option
                  v-for="opt in availableSpecialSkillNames(index)"
                  :key="opt.value"
                  :value="opt.value"
                >{{ opt.label }}</option>
              </select>
            </div>
            <input
              type="text"
              v-model="specialSkill.note"
              v-show="specialSkill.showNote"
              class="special-skill-note-input"
              :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
            />
          </div>
        </li>
      </ul>
      <div
        class="add-button-container-left"
        v-if="localSpecialSkills.length < AioniaGameData.config.maxSpecialSkills"
      >
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="addSpecialSkillItem()"
          aria-label="特技を追加"
        >＋</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';

const characterStore = useCharacterStore();
const localSpecialSkills = characterStore.specialSkills;

function hasSpecialSkillContent(ss) {
  return !!(ss.group || ss.name || ss.note);
}

function addSpecialSkillItem() {
  if (localSpecialSkills.length >= AioniaGameData.config.maxSpecialSkills) return;
  localSpecialSkills.push({ group: '', name: '', note: '', showNote: false });
}

function removeSpecialSkill(index) {
  const list = localSpecialSkills;
  if (list.length > 1) {
    list.splice(index, 1);
  } else if (hasSpecialSkillContent(list[index])) {
    list[index] = { group: '', name: '', note: '', showNote: false };
  }
}

function availableSpecialSkillNames(index) {
  const item = localSpecialSkills[index];
  return item ? AioniaGameData.specialSkillData[item.group] || [] : [];
}

function updateSpecialSkillOptions(index) {
  const item = localSpecialSkills[index];
  if (item) {
    item.name = '';
    updateSpecialSkillNoteVisibility(index);
  }
}

function updateSpecialSkillNoteVisibility(index) {
  const item = localSpecialSkills[index];
  if (item) {
    const skillName = item.name;
    item.showNote = AioniaGameData.specialSkillsRequiringNote.includes(skillName);
  }
}
</script>

