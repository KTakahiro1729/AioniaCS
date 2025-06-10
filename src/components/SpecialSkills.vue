<template>
  <div id="special_skills" class="special-skills">
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
  manageListItemUtil: { // For _manageListItem from App.vue
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
    list: localSpecialSkills, // Operate on local copy
    action: "add",
    newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
    maxLength: props.AioniaGameData.config.maxSpecialSkills,
  });
  emitSpecialSkillsUpdate(); // Notify parent
};

const removeSpecialSkill = (index) => {
  props.manageListItemUtil({
    list: localSpecialSkills, // Operate on local copy
    action: "remove",
    index,
    newItemFactory: () => ({ group: "", name: "", note: "", showNote: false }),
    hasContentChecker: hasSpecialSkillContent, // This method is now local
  });
  emitSpecialSkillsUpdate(); // Notify parent
};

const availableSpecialSkillNames = computed(() => (index) => {
  const skill = localSpecialSkills[index];
  return skill ? (props.AioniaGameData.specialSkillData[skill.group] || []) : [];
});

const updateSpecialSkillOptions = (index) => {
  const skill = localSpecialSkills[index];
  if (skill) {
    skill.name = ""; // Reset name when group changes
    updateSpecialSkillNoteVisibility(index); // Update note visibility based on new (empty) name
  }
  emitSpecialSkillsUpdate();
};

const updateSpecialSkillNoteVisibility = (index) => {
  const skill = localSpecialSkills[index];
  if (skill) {
    const skillName = skill.name;
    skill.showNote = props.AioniaGameData.specialSkillsRequiringNote.includes(skillName);
  }
  // No direct emit here, assuming this is called before a name change emit or group change emit
};


// Specific handlers for @change to ensure updates are emitted
const handleSpecialSkillGroupChange = (index) => {
  updateSpecialSkillOptions(index); // This will also call updateSpecialSkillNoteVisibility
  // emitSpecialSkillsUpdate() is called by updateSpecialSkillOptions
};

const handleSpecialSkillNameChange = (index) => {
  updateSpecialSkillNoteVisibility(index);
  emitSpecialSkillsUpdate();
};


// Fallback watcher for any deep changes not caught by explicit @change
watch(localSpecialSkills, () => {
  emitSpecialSkillsUpdate();
}, { deep: true });

</script>

<style scoped>
/* Styles specific to #special_skills */
.special-skills {
  grid-area: special-skills; /* Assigns this component to the 'special-skills' grid area */
}

/* .box-title and .box-content are assumed to be global or styled by parent grid item */

.special-skills-list {
  /* Uses base-list-item defined globally or locally */
}

/* Copied from App.vue - base-list-item and related styles if not global */
.base-list-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small);
  gap: var(--spacing-small);
}
.base-list-item:last-child {
    margin-bottom: 0;
}

.special-skill-item .flex-grow {
  display: flex;
  flex-direction: column; /* Stack select group and note input vertically */
  gap: var(--spacing-xsmall); /* Space between select group and note input */
}

.delete-button-wrapper {
  flex-shrink: 0;
}

.list-button { /* Assuming this is a global style or defined in a base sheet */
  padding: var(--button-padding-small);
  font-size: var(--font-size-small);
  line-height: 1;
  min-width: var(--button-min-width-small);
  height: var(--button-min-width-small);
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.list-button--delete {
  background-color: var(--color-button-danger-bg);
}
.list-button--delete:hover {
  background-color: var(--color-button-danger-hover-bg);
}
.list-button--delete:disabled {
  background-color: var(--color-button-disabled-bg);
  border-color: var(--color-button-disabled-border);
  color: var(--color-button-disabled-text);
}

.list-button--add {
   background-color: var(--color-button-primary-bg);
}
.list-button--add:hover {
   background-color: var(--color-button-primary-hover-bg);
}
/* End copied button styles */

.flex-group {
  display: flex;
  gap: var(--spacing-small); /* Space between the two select elements */
}

.flex-item-1 {
  flex: 1; /* Adjust flex ratio as needed */
}

.flex-item-2 {
  flex: 2; /* Adjust flex ratio as needed */
}

.special-skills select,
.special-skill-note-input {
  width: 100%;
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box;
  height: var(--input-height-base);
}

.special-skills select:focus,
.special-skill-note-input:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}

.special-skills select:disabled {
  background-color: var(--color-background-input-disabled);
  color: var(--color-text-input-disabled);
}

.special-skill-note-input {
  /* Height might be different if it's a text input vs select, adjust if necessary */
  /* Or set a specific class for textareas if they differ more significantly */
}

.add-button-container-left {
  margin-top: var(--spacing-small);
}

.flex-grow { /* Define if not global */
    flex-grow: 1;
}
</style>
