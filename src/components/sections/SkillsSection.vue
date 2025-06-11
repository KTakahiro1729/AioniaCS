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
            <li v-for="(expert, index) in skill.experts" :key="index" class="base-list-item">
              <div class="delete-button-wrapper">
                <button type="button" class="button-base list-button list-button--delete" @click="emit('remove-expert', { skill, index })" :disabled="skill.experts.length <= 1 && expert.value===''"></button>
              </div>
              <input type="text" v-model="expert.value" :placeholder="placeholder(skill)" :disabled="!skill.checked" class="flex-grow" />
            </li>
          </ul>
          <div class="add-button-container-left">
            <button type="button" class="button-base list-button list-button--add" @click="emit('add-expert', skill)">＋</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
<script setup>
const props = defineProps({ skills: Array });
const emit = defineEmits(['add-expert', 'remove-expert']);
const placeholder = (skill) => (skill.checked ? '専門技能' : '－');
</script>
