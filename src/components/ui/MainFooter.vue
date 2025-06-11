<script setup>
import HelpPanel from './HelpPanel.vue';
import { ref } from 'vue';

const props = defineProps({
  helpState: String,
  experienceStatusClass: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  isSignedIn: Boolean,
  canOperateDrive: Boolean,
  outputButtonText: String,
  isCloudSaveSuccess: Boolean,
});
const emit = defineEmits([
  'saveData',
  'saveToDrive',
  'fileUpload',
  'loadFromDrive',
  'output',
  'helpOver',
  'helpLeave',
  'helpClick',
  'closeHelp',
]);

const helpIcon = ref(null);
const helpPanel = ref(null);

defineExpose({ helpIcon, helpPanel });
</script>
<template>
  <div class="main-footer">
    <div
      ref="helpIcon"
      class="button-base footer-help-icon"
      :class="{ 'footer-help-icon--fixed': props.helpState === 'fixed' }"
      @mouseover="emit('helpOver')"
      @mouseleave="emit('helpLeave')"
      @click="emit('helpClick')"
      tabindex="0"
    >
      ？
    </div>
    <div :class="['status-display', props.experienceStatusClass]">
      経験点 {{ props.currentExperiencePoints }} / {{ props.maxExperiencePoints }}
    </div>
    <div class="status-display status-display--weight">
      荷重: {{ props.currentWeight }}
    </div>
    <div class="footer-button-container">
      <button class="button-base footer-button footer-button--save" @click="emit('saveData')">データ保存</button>
      <button
        v-if="props.isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="emit('saveToDrive')"
        :disabled="!props.canOperateDrive"
        title="Google Driveに保存"
      >
        <span v-if="props.isCloudSaveSuccess" class="icon-svg icon-svg--footer icon-svg-success" aria-label="Save Succeeded"></span>
        <span v-else class="icon-svg icon-svg--footer icon-svg-upload" aria-label="Save to Drive"></span>
      </button>
    </div>
    <div class="footer-button-container">
      <label for="load_input_vue" class="button-base footer-button footer-button--load">データ読込</label>
      <input type="file" id="load_input_vue" @change="(e) => emit('fileUpload', e)" accept=".json,.txt,.zip" class="hidden" />
      <button
        v-if="props.isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="emit('loadFromDrive')"
        :disabled="!props.isSignedIn"
        title="Google Driveから読込"
      >
        <span class="icon-svg icon-svg--footer icon-svg-download" aria-label="Load from Drive"></span>
      </button>
    </div>
    <div class="button-base footer-button footer-button--output" @click="emit('output')">
      {{ props.outputButtonText }}
    </div>
    <HelpPanel ref="helpPanel" :visible="props.helpState !== 'closed'" @close="emit('closeHelp')">
      <slot />
    </HelpPanel>
  </div>
</template>
