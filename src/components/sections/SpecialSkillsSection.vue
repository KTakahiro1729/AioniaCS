<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">
      <div class="box-title-main">
        <span class="box-title-text">特技</span>
        <label class="description-toggle">
          <input type="checkbox" v-model="uiStore.showSpecialSkillDescriptions" />
          説明を表示
        </label>
      </div>
    </div>
    <div class="box-content">
      <ul class="list-reset">
        <li class="base-list-header special-skill-list-header">
          <div class="flex-item-delete"></div>
          <div class="flex-item-group">種類</div>
          <div class="flex-item-name">名称</div>
          <div class="flex-item-acquired">獲得</div>
        </li>
      </ul>
      <ul class="list-reset special-skills-list">
        <li v-for="(specialSkill, index) in localSpecialSkills" :key="index" class="base-list-item special-skill-item">
          <div class="delete-button-wrapper flex-item-delete" v-if="!uiStore.isViewingShared">
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
                class="flex-item-group"
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
                class="flex-item-name"
                :disabled="uiStore.isViewingShared"
              />
              <select
                v-else
                v-model="specialSkill.name"
                @change="updateSpecialSkillNoteVisibility(index)"
                :disabled="!specialSkill.group || uiStore.isViewingShared"
                class="flex-item-name"
                :title="getSpecialSkillDescription(specialSkill)"
              >
                <option value="">---</option>
                <option v-for="opt in availableSpecialSkillNames(index)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
              <select v-model="specialSkill.acquired" class="flex-item-acquired" :disabled="!specialSkill.group || uiStore.isViewingShared">
                <option
                  v-for="option in characterStore.acquisitionOptionsForSpecialSkills"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                >
                  {{ option.text }}
                </option>
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
            <textarea
              v-if="
                uiStore.showSpecialSkillDescriptions &&
                specialSkill.group !== 'free' &&
                getSpecialSkillDescription(specialSkill)
              "
              class="special-skill-description"
              :value="getSpecialSkillDescription(specialSkill)"
              readonly
            ></textarea>
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
import { computed } from 'vue';
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const localSpecialSkills = characterStore.specialSkills;

const specialSkillDescriptionMap = computed(() => {
  const map = {};
  Object.entries(AioniaGameData.specialSkillData).forEach(([group, skills]) => {
    map[group] = skills.reduce((acc, skill) => {
      acc[skill.value] = skill.description || '';
      return acc;
    }, {});
  });
  return map;
});

function hasSpecialSkillContent(ss) {
  return !!(ss.group || ss.name || ss.note);
}

function availableSpecialSkillNames(index) {
  const item = localSpecialSkills[index];
  return item ? AioniaGameData.specialSkillData[item.group] || [] : [];
}

function getSpecialSkillDescription(item) {
  if (!item || !item.group || item.group === 'free') {
    return '';
  }
  return specialSkillDescriptionMap.value[item.group]?.[item.name] || '';
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
.special-skill-list-header {
  display: flex;
  font-size: 0.9em;
  color: var(--color-text-muted);
  padding: 0 5px;
  align-items: center;
  margin-bottom: 5px;
}

.special-skill-item .flex-group {
  align-items: center;
}

.flex-item-delete {
  width: 30px;
  flex-shrink: 0;
  text-align: center;
}
.flex-item-group {
  flex: 2;
  max-width: 100px;
  margin-right: 1px;
}
.flex-item-name {
  flex: 3;
  margin-right: 1px;
}
.flex-item-acquired {
  flex: 2;
  margin-right: 1px;
}
.flex-item-exp {
  width: 30px;
  flex-shrink: 0;
  justify-content: center;
}

.special-skill-note-input {
  margin-top: 3px;
}

textarea.special-skill-note-input {
  min-height: 45px;
  resize: vertical;
}

.special-skill-description {
  margin-top: 3px;
  min-height: 45px;
  resize: vertical;
}

.box-title-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.description-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
}

.description-toggle input[type='checkbox'] {
  accent-color: var(--color-accent-primary);
}
</style>
