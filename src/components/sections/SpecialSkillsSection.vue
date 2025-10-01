<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <div class="base-list-header">
        <div class="delete-button-wrapper base-list-header-placeholder"></div>
        <div class="flex-grow">
          <div class="special-skill-item-inputs">
            <div class="flex-special-type"><label>種類</label></div>
            <div class="flex-special-name"><label>名称</label></div>
            <div class="flex-special-acquired"><label>獲得</label></div>
            <div class="flex-special-reward"><label>報酬</label></div>
          </div>
        </div>
      </div>
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
            <div class="special-skill-item-inputs">
              <div class="flex-special-type">
                <select
                  v-model="specialSkill.group"
                  @change="updateSpecialSkillOptions(index)"
                  :disabled="uiStore.isViewingShared"
                >
                  <option
                    v-for="option in AioniaGameData.specialSkillGroupOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="flex-special-name">
                <template v-if="specialSkill.group === 'free'">
                  <input type="text" v-model="specialSkill.name" :disabled="uiStore.isViewingShared" />
                  <textarea
                    v-model="specialSkill.note"
                    class="special-skill-note-input"
                    :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
                    :disabled="uiStore.isViewingShared"
                  ></textarea>
                </template>
                <template v-else>
                  <select
                    v-model="specialSkill.name"
                    @change="updateSpecialSkillNoteVisibility(index)"
                    :disabled="!specialSkill.group || uiStore.isViewingShared"
                  >
                    <option value="">---</option>
                    <option v-for="opt in availableSpecialSkillNames(index)" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                  <input
                    type="text"
                    v-model="specialSkill.note"
                    v-show="specialSkill.showNote"
                    class="special-skill-note-input"
                    :placeholder="AioniaGameData.placeholderTexts.specialSkillNote"
                    :disabled="uiStore.isViewingShared"
                  />
                </template>
              </div>
              <div class="flex-special-acquired">
                <select v-model="specialSkill.acquired" :disabled="uiStore.isViewingShared">
                  <option
                    v-for="option in acquisitionOptions"
                    :key="option.value"
                    :value="option.value"
                    :disabled="option.disabled"
                  >
                    {{ option.text }}
                  </option>
                </select>
              </div>
              <div class="flex-special-reward">
                <label class="special-skill-reward-checkbox">
                  <input
                    type="checkbox"
                    v-model="specialSkill.excludeFromExp"
                    :disabled="uiStore.isViewingShared"
                  />
                  <span>除外</span>
                </label>
              </div>
            </div>
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
import { computed, watch } from 'vue';
import { AioniaGameData } from '../../data/gameData.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
const localSpecialSkills = characterStore.specialSkills;

const acquisitionOptions = computed(() => characterStore.acquisitionOptionsForSpecialSkills);

watch(
  localSpecialSkills,
  (skills) => {
    if (!skills) return;
    skills.forEach((skill) => {
      if (!Object.prototype.hasOwnProperty.call(skill, 'acquired')) {
        skill.acquired = '作成時';
      }
      if (!Object.prototype.hasOwnProperty.call(skill, 'excludeFromExp')) {
        skill.excludeFromExp = false;
      }
    });
  },
  { deep: true, immediate: true },
);

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
.special-skill-item-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.flex-special-type {
  flex: 0 1 130px;
  min-width: 120px;
}

.flex-special-name {
  flex: 1 1 220px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.flex-special-acquired {
  flex: 0 1 140px;
  min-width: 120px;
}

.flex-special-reward {
  flex: 0 0 100px;
  min-width: 90px;
  display: flex;
  align-items: center;
}

.special-skill-note-input {
  margin-top: 3px;
}

textarea.special-skill-note-input {
  min-height: 45px;
  resize: vertical;
}

.special-skill-reward-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
