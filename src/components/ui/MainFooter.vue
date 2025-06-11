<template>
  <div class="footer-button-wrapper">
    <button class="button-base footer-button footer-button--save" @click="emit('save')">
      データ保存
    </button>
    <button class="button-base footer-button footer-button--cloud" v-if="signedIn" @click="emit('cloud-save')" :disabled="!canOperate">
      <span v-if="cloudSuccess" class="icon-svg icon-svg--footer icon-svg-success" aria-label="Save Succeeded"></span>
      <span v-else class="icon-svg icon-svg--footer icon-svg-upload" aria-label="Save to Drive"></span>
    </button>
    <label for="load_input_vue" class="button-base footer-button footer-button--load">データ読込</label>
    <input type="file" id="load_input_vue" @change="e => emit('load', e)" accept=".json,.txt,.zip" class="hidden" />
    <button class="button-base footer-button footer-button--cloud" v-if="signedIn" @click="emit('cloud-load')" :disabled="!signedIn" title="Google Driveから読込">
      <span class="icon-svg icon-svg--footer icon-svg-download" aria-label="Load from Drive"></span>
    </button>
    <div class="button-base footer-button footer-button--output" @click="emit('cocofolia')" ref="outputButton">
      <slot name="output-text" />
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  signedIn: Boolean,
  canOperate: Boolean,
  cloudSuccess: Boolean,
});
const emit = defineEmits(['save', 'cloud-save', 'load', 'cloud-load', 'cocofolia']);
</script>
