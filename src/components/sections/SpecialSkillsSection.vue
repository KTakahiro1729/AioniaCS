<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <ul class="list-reset special-skills-list">
        <li v-for="(specialSkill, index) in localSpecialSkills" :key="index" class="base-list-item special-skill-item">
          <div class="delete-button-wrapper" v-if="!uiStore.isViewingShared">
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="characterStore.removeSpecialSkill(index)"
              :disabled="localSpecialSkills.length <= 1 && !hasSpecialSkillContent(specialSkill)"
              aria-label="特技を削除"
            >
              －
            </button>
          </div>
          <div class="flex-grow">
            <div class="flex-group">
              <select
                v-model="specialSkill.group"
                @change="updateSpecialSkillOptions(index)"
                class="flex-item-1"
                :disabled="uiStore.isViewingShared"
              >
                <option v-for="option in AioniaGameData.specialSkillGroupOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <input
                v-if="specialSkill.group === 'free'"
                type="text"
                v-model="specialSkill.name"
                class="flex-item-2"
                :disabled="uiStore.isViewingShared"
              />
              <select
                v-else
                v-model="specialSkill.name"
                @change="updateSpecialSkillNoteVisibility(index)"
                :disabled="!specialSkill.group || uiStore.isViewingShared"
                class="flex-item-2"
              >
                <option value="">---</option>
                <option v-for="opt in availableSpecialSkillNames(index)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <textarea
              v-if="specialSkill.group === 'free'"
              v-model="specialSkill.note"
              class="special-skill-note-input"
              :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
              :disabled="uiStore.isViewingShared"
            ></textarea>
            <input
              v-else
              type="text"
              v-model="specialSkill.note"
              v-show="specialSkill.showNote"
              class="special-skill-note-input"
              :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
              :disabled="uiStore.isViewingShared"
            />
          </div>
        </li>
      </ul>
      <div
        class="add-button-container-left"
        v-if="!uiStore.isViewingShared && localSpecialSkills.length < AioniaGameData.config.maxSpecialSkills"
      >
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="characterStore.addSpecialSkillItem()"
          aria-label="特技を追加"
        >
          ＋
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const localSpecialSkills = characterStore.specialSkills;

function hasSpecialSkillContent(ss) {
  return !!(ss.group || ss.name || ss.note);
}

function availableSpecialSkillNames(index) {
  const item = localSpecialSkills[index];
  return item ? AioniaGameData.specialSkillData[item.group] || [] : [];
}

function updateSpecialSkillOptions(index) {
  const item = localSpecialSkills[index];
  if (item) {
    item.name = '';
    item.note = '';
    item.showNote = item.group === 'free';
    if (item.group !== 'free') {
      updateSpecialSkillNoteVisibility(index);
    }
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

<style scoped>
.special-skill-note-input {
  margin-top: 3px;
}

textarea.special-skill-note-input {
  min-height: 45px;
  resize: vertical;
}
</style>
