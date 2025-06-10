<template>
  <div class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <ul class="list-reset special-skills-list">
        <li v-for="(specialSkill, index) in localSpecialSkills" :key="index" class="base-list-item special-skill-item">
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
                @change="handleSpecialSkillGroupChange(index)"
                class="flex-item-1"
              >
                <option
                  v-for="option in props.AioniaGameData.specialSkillGroupOptions"
                  :key="option.value"
                  :value="option.value"
                >{{ option.label }}</option>
              </select>
              <select
                v-model="specialSkill.name"
                @change="handleSpecialSkillNameChange(index)"
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
              @change="emitSpecialSkillsUpdate"
              class="special-skill-note-input"
              :placeholder="props.AioniaGameData.placeholderTexts.specialSkillNote"
            />
          </div>
        </li>
      </ul>
      <div class="add-button-container-left" v-if="localSpecialSkills.length < props.AioniaGameData.config.maxSpecialSkills">
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
import { defineProps, defineEmits, reactive, watch, computed } from 'vue';

const props = defineProps({
  specialSkills: {
    type: Array,
    required: true,
  },
  AioniaGameData: {
    type: Object,
    required: true,
  },
  manageListItemUtil: {
    type: Function,
    required: true,
  }
});

const emit = defineEmits(['update:specialSkills', 'special-skills-changed']);

const localSpecialSkills = reactive(JSON.parse(JSON.stringify(props.specialSkills)));

watch(() => props.specialSkills, (newSkills) => {
  localSpecialSkills.length = 0;
  newSkills.forEach(skill => localSpecialSkills.push(JSON.parse(JSON.stringify(skill))));
}, { deep: true });

const emitSpecialSkillsUpdate = () => {
  emit('update:specialSkills', JSON.parse(JSON.stringify(localSpecialSkills)));
  emit('special-skills-changed');
};

const hasSpecialSkillContent = (ss) => !!(ss.group || ss.name || ss.note);

const addSpecialSkillItem = () => {
  props.manageListItemUtil({
    list: localSpecialSkills,
    action: "add",
    newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
    maxLength: props.AioniaGameData.config.maxSpecialSkills,
  });
  emitSpecialSkillsUpdate();
};

const removeSpecialSkill = (index) => {
  props.manageListItemUtil({
    list: localSpecialSkills,
    action: "remove",
    index,
    newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
    hasContentChecker: hasSpecialSkillContent,
  });
  emitSpecialSkillsUpdate();
};

const availableSpecialSkillNames = computed(() => (index) => {
  const skill = localSpecialSkills[index];
  return skill ? (props.AioniaGameData.specialSkillData[skill.group] || []) : [];
});

const updateSpecialSkillOptions = (index) => {
  const skill = localSpecialSkills[index];
  if (skill) {
    skill.name = "";
    updateSpecialSkillNoteVisibility(index);
  }
  emitSpecialSkillsUpdate();
};

const updateSpecialSkillNoteVisibility = (index) => {
  const skill = localSpecialSkills[index];
  if (skill) {
    const skillName = skill.name;
    skill.showNote = props.AioniaGameData.specialSkillsRequiringNote.includes(skillName);
  }
};

const handleSpecialSkillGroupChange = (index) => {
  updateSpecialSkillOptions(index);
};

const handleSpecialSkillNameChange = (index) => {
  updateSpecialSkillNoteVisibility(index);
  emitSpecialSkillsUpdate();
};

watch(localSpecialSkills, () => {
  emitSpecialSkillsUpdate();
}, { deep: true });

</script>

<style scoped>
/* .special-skills is styled by _layout.css (grid-area) */
/* .box-title, .box-content are styled by _components.css */
/* .list-reset is from _base.css */
/* .base-list-item and button styles (.delete-button-wrapper, .list-button, etc.) are from _components.css */
/* .flex-group, .flex-item-1, .flex-item-2, .flex-grow (general) are from _layout.css */
/* select, input[type="text"] general styling is from _components.css */
/* .add-button-container-left is from _components.css */

/* This specific layout for the content of a special skill item is unique. */
.special-skill-item .flex-grow {
  display: flex;
  flex-direction: column; /* Stack select group and note input vertically */
  gap: var(--spacing-xsmall); /* Space between select group and note input */
}

/* Style moved from _sections.css */
.special-skill-note-input {
  margin-top: 3px;
}

/*
  The .special-skills-list class on the UL doesn't have specific global styles other than what .box-content provides.
  It's kept for semantic clarity or future specific targeting.
*/
</style>
