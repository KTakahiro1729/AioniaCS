<template>
  <div class="main-footer">
    <div
      class="button-base footer-help-icon"
      ref="helpIcon"
      :class="{ 'footer-help-icon--fixed': helpState === 'fixed' }"
      @mouseover="$emit('help-mouseover')"
      @mouseleave="$emit('help-mouseleave')"
      @click="$emit('help-click')"
      tabindex="0"
    >
      ？
    </div>
    <div :class="['status-display', experienceStatusClass]">
      経験点 {{ currentExperiencePoints }} / {{ maxExperiencePoints }}
    </div>
    <div class="status-display status-display--weight">
      荷重: {{ currentWeight }}
    </div>
    <div class="footer-button-container">
      <button class="button-base footer-button footer-button--save" @click="$emit('save')">
        データ保存
      </button>
      <button
        v-if="isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="$emit('save-to-drive')"
        :disabled="!canOperateDrive"
        title="Google Driveに保存"
      >
        <span
          v-if="isCloudSaveSuccess"
          class="icon-svg icon-svg--footer icon-svg-success"
          aria-label="Save Succeeded"
        ></span>
        <span
          v-else
          class="icon-svg icon-svg--footer icon-svg-upload"
          aria-label="Save to Drive"
        ></span>
      </button>
    </div>
    <div class="footer-button-container">
      <label for="load_input_vue" class="button-base footer-button footer-button--load">データ読込</label>
      <input type="file" id="load_input_vue" @change="(e) => $emit('file-upload', e)" accept=".json,.txt,.zip" class="hidden" />
      <button
        v-if="isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="$emit('load-from-drive')"
        :disabled="!isSignedIn"
        title="Google Driveから読込"
      >
        <span class="icon-svg icon-svg--footer icon-svg-download" aria-label="Load from Drive"></span>
      </button>
    </div>
    <div class="button-base footer-button footer-button--output" @click="$emit('output')" ref="outputButton">
      {{ outputButtonText }}
    </div>
  </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';

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

const outputButton = ref(null);
const helpIcon = ref(null);

defineExpose({ outputButton, helpIcon });
</script>

<style scoped>
</style>

