<template>
  <div id="skills" class="skills">
    <div class="box-title">技能</div>
    <ul class="skills-list box-content list-reset">
      <li v-for="(skill) in localSkills" :key="skill.id" class="skill-list">
        <div class="skill-header">
          <input
            type="checkbox"
            :id="skill.id"
            v-model="skill.checked"
            @change="handleSkillChange(skill)"
          />
          <label :for="skill.id" class="skill-name">{{ skill.name }}</label>
        </div>
        <div v-if="skill.canHaveExperts && skill.checked" class="experts-section">
          <ul class="expert-list list-reset">
            <li v-for="(expert, expIndex) in skill.experts" :key="expIndex" class="base-list-item">
              <div class="delete-button-wrapper">
                <button
                  type="button"
                  class="button-base list-button list-button--delete"
                  @click="removeExpert(skill, expIndex)"
                  :disabled="skill.experts.length <= 1 && expert.value===''"
                  aria-label="専門技能を削除"
                >－</button>
              </div>
              <input
                type="text"
                v-model="expert.value"
                :placeholder="expertPlaceholder(skill)"
                :disabled="!skill.checked"
                class="flex-grow"
                @change="handleExpertChange(skill)"
              />
            </li>
          </ul>
          <div class="add-button-container-left">
            <button
              type="button"
              class="button-base list-button list-button--add"
              @click="addExpert(skill)"
              aria-label="専門技能を追加"
            >＋</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch } from 'vue';
// AioniaGameData is passed as a prop
// deepClone is needed if _manageListItem is localized, but we'll pass _manageListItem as a prop.

const props = defineProps({
  skills: {
    type: Array,
    required: true,
  },
  AioniaGameData: {
    type: Object,
    required: true,
  },
  manageListItemUtil: { // Renamed from _manageListItem to avoid leading underscore convention for props
    type: Function,
    required: true,
  }
});

const emit = defineEmits(['update:skills', 'skills-changed']); // skills-changed can notify parent for broader updates like experience calc

// Local reactive copy of skills to allow modification
const localSkills = reactive(JSON.parse(JSON.stringify(props.skills)));

// Watch for prop changes to update localSkills
watch(() => props.skills, (newSkills) => {
  // More robust update: replace items one by one or fully replace if lengths differ significantly
  // This simple splice might lose reactivity on individual items if not handled carefully elsewhere
  localSkills.length = 0; // Clear the array
  newSkills.forEach(skill => localSkills.push(JSON.parse(JSON.stringify(skill))));
}, { deep: true });

const emitSkillsUpdate = () => {
  // Emit a deep clone of the local skills array
  emit('update:skills', JSON.parse(JSON.stringify(localSkills)));
  emit('skills-changed'); // General notification for recalculations, etc.
};

const addExpert = (skill) => {
  if (skill.canHaveExperts) {
    props.manageListItemUtil({
      list: skill.experts,
      action: "add",
      newItemFactory: () => ({ value: "" })
    });
    emitSkillsUpdate();
  }
};

const removeExpert = (skill, expertIndex) => {
  props.manageListItemUtil({
    list: skill.experts,
    action: "remove",
    index: expertIndex,
    newItemFactory: () => ({ value: "" }),
    hasContentChecker: (expert) => expert.value && expert.value.trim() !== "",
  });
  emitSkillsUpdate();
};

const expertPlaceholder = (skill) => {
  // Ensure AioniaGameData is accessed via props
  return skill.checked ? props.AioniaGameData.placeholderTexts.expertSkill : props.AioniaGameData.placeholderTexts.expertSkillDisabled;
};

const handleSkillChange = (skill) => {
  // If a skill is unchecked, and it has experts, you might want to clear them or handle them based on game rules.
  // For now, just emitting the update.
  if (!skill.checked && skill.canHaveExperts) {
    // Optional: Clear experts when skill is unchecked
    // skill.experts = [{ value: "" }];
  }
  emitSkillsUpdate();
};

const handleExpertChange = (skill) => {
  // Called when an expert's text value changes.
  // This is to ensure the parent is notified of changes within the expert list items.
  emitSkillsUpdate();
};

// Watch for any changes within localSkills to auto-emit updates
// This is a bit of a catch-all. Specific @change handlers on inputs are more precise.
watch(localSkills, () => {
  emitSkillsUpdate();
}, { deep: true });

</script>

<style scoped>
/* Styles specific to #skills */
.skills {
  grid-area: skills; /* Assigns this component to the 'skills' grid area */
}

.skills-list {
  /* Uses skill-list, skill-header, etc. defined below or globally */
  padding-top: 0; /* Remove box-content default padding if title is outside */
}

.skill-list {
  margin-bottom: var(--spacing-medium);
  padding-bottom: var(--spacing-medium);
  border-bottom: 1px solid var(--color-border-separator-light);
}
.skill-list:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.skill-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small); /* Space between skill name and experts section */
}

.skill-header input[type="checkbox"] {
  margin-right: var(--spacing-small);
  /* Larger checkbox for easier clicking */
  width: calc(var(--font-size-medium) * 1.2);
  height: calc(var(--font-size-medium) * 1.2);
}

.skill-name {
  font-size: var(--font-size-large); /* Original was --font-size-medium, bumped for clarity */
  font-weight: var(--font-weight-bold);
  color: var(--color-text-default);
}

.experts-section {
  padding-left: calc(var(--font-size-medium) * 1.2 + var(--spacing-medium)); /* Align with skill name text */
  /* Original had var(--spacing-large), adjusted to sum of checkbox width and its margin */
}

.expert-list {
  /* Uses base-list-item defined globally or scoped here */
}

/* If base-list-item is not global, define it (copied from ScarsWeaknesses for now) */
.base-list-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small);
  gap: var(--spacing-small);
}
.base-list-item:last-child {
    margin-bottom: 0;
}


.delete-button-wrapper {
  flex-shrink: 0; /* Prevent button from shrinking */
}

/* list-button styles should be global or defined here */
.list-button {
  padding: var(--button-padding-small);
  font-size: var(--font-size-small);
  line-height: 1; /* Ensure '-' and '+' are centered */
  min-width: var(--button-min-width-small);
  height: var(--button-min-width-small); /* Make it square */
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


.expert-list input[type="text"] {
  /* Uses .flex-grow from global or defined here */
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input); /* Ensure font size consistency */
  height: var(--input-height-base); /* From _variables.css */
  box-sizing: border-box;
}
.expert-list input[type="text"]:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}
.expert-list input[type="text"]:disabled {
  background-color: var(--color-background-input-disabled);
  color: var(--color-text-input-disabled);
  border-color: var(--color-border-input-disabled);
}


.add-button-container-left {
  margin-top: var(--spacing-small);
  /* Aligns button to the left, useful if list items have delete buttons on left */
}

.flex-grow { /* Define if not global */
    flex-grow: 1;
}
</style>
