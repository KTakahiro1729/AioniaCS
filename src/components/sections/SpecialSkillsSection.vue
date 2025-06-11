<template>
  <div id="special_skills" class="special-skills">
    <div class="box-title">特技</div>
    <div class="box-content">
      <ul class="list-reset special-skills-list">
        <li v-for="(ss, index) in specialSkills" :key="index" class="base-list-item special-skill-item">
          <div class="delete-button-wrapper">
            <button type="button" class="button-base list-button list-button--delete" @click="emit('remove', index)" :disabled="specialSkills.length <= 1 && !hasContent(ss)">－</button>
          </div>
          <div class="flex-grow">
            <div class="flex-group">
              <select v-model="ss.group" @change="emit('update-group', index)" class="flex-item-1">
                <option v-for="option in groupOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <select v-model="ss.name" @change="emit('update-name', index)" :disabled="!ss.group" class="flex-item-2">
                <option value="">---</option>
                <option v-for="opt in nameOptions(index)" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <input type="text" v-model="ss.note" v-show="ss.showNote" class="special-skill-note-input" :placeholder="notePlaceholder" />
          </div>
        </li>
      </ul>
      <div class="add-button-container-left" v-if="specialSkills.length < max">
        <button type="button" class="button-base list-button list-button--add" @click="emit('add')">＋</button>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  specialSkills: Array,
  groupOptions: Array,
  nameOptions: Function,
  max: Number,
  notePlaceholder: String
});
const emit = defineEmits(['add', 'remove', 'update-group', 'update-name']);
const hasContent = (ss) => !!(ss.group || ss.name || ss.note);
</script>
