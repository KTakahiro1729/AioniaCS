<template>
  <div class="skills">
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

const props = defineProps({
  skills: {
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

const emit = defineEmits(['update:skills', 'skills-changed']);

const localSkills = reactive(JSON.parse(JSON.stringify(props.skills)));

watch(() => props.skills, (newSkills) => {
  localSkills.length = 0;
  newSkills.forEach(skill => localSkills.push(JSON.parse(JSON.stringify(skill))));
}, { deep: true });

const emitSkillsUpdate = () => {
  emit('update:skills', JSON.parse(JSON.stringify(localSkills)));
  emit('skills-changed');
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
  return skill.checked ? props.AioniaGameData.placeholderTexts.expertSkill : props.AioniaGameData.placeholderTexts.expertSkillDisabled;
};

const handleSkillChange = (skill) => {
  if (!skill.checked && skill.canHaveExperts) {
    // skill.experts = [{ value: "" }]; // Optional: Clear experts
  }
  emitSkillsUpdate();
};

const handleExpertChange = (skill) => {
  emitSkillsUpdate();
};

watch(localSkills, () => {
  emitSkillsUpdate();
}, { deep: true });

</script>

<style scoped>
/* .skills is styled by _layout.css (grid-area) */
/* .box-title is styled by _components.css */
/* .box-content is styled by _components.css (padding, border) */
/* .list-reset is styled by _base.css */
/* .base-list-item, .delete-button-wrapper, .list-button, .add-button-container-left are from _components.css */
/* input[type="text"] general styles are from _components.css */
/* .flex-grow is from _layout.css */

/* Styles moved from _sections.css for Skills List */
.skills-list { /* This is the <ul> */
  padding: 18px; /* from _sections.css */
  /* The .box-content class also adds padding. This might lead to double padding. */
  /* The rule below attempts to mitigate this for the top padding. */
}

.skills-list.box-content {
  padding-top: 0;
}

.skill-list { /* This is the <li> element */
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--color-border-normal);
  border-radius: 3px;
  background-color: var(--color-panel-specialskill);
}
/* Added from sections.css: .skills-list > li */
.skill-list:last-child { /* Ensure this is specific enough if it was from .skills-list > li:last-child */
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}


.skill-header { /* from _sections.css: .skills-list > li .skill-header */
  display: flex;
  align-items: center;
  /* margin-bottom from original scoped style was var(--spacing-small), removed to defer to global structure */
}

.experts-section { /* from _sections.css: .skills-list > li .experts-section */
  margin-top: 0;
   /* padding-left from original scoped style is kept for specific alignment */
  padding-left: calc(var(--font-size-medium) * 1.2 + var(--spacing-small));
}

.expert-list { /* from _sections.css */
  margin-top: 5px;
}
/* End of styles moved from _sections.css */


/* Kept specific scoped styles */
.skill-header input[type="checkbox"] {
  margin-right: var(--spacing-small);
  width: calc(var(--font-size-medium) * 1.2);
  height: calc(var(--font-size-medium) * 1.2);
}

.skill-name {
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-default);
}

</style>
