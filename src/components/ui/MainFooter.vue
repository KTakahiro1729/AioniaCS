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
      <button
        class="button-base footer-button footer-button--save"
        @click="handleSaveMain"
        :title="saveMainTitle"
      >
        データ保存
      </button>
      <button
        v-if="config.saveAlt"
        class="button-base footer-button footer-button--cloud"
        @click="handleSaveAlt"
        :disabled="config.saveAlt === 'cloudSave' && !canOperateDrive"
        :title="saveAltTitle"
      >
        <span
          v-if="config.saveAlt === 'cloudSave'"
          :class="['icon-svg', 'icon-svg--footer', isCloudSaveSuccess ? 'icon-svg-success' : 'icon-svg-upload']"
          aria-label="Cloud Save"
        ></span>
        <span v-else>📥</span>
      </button>
    </div>
    <div class="footer-button-container">
      <component
        :is="loadMainIsLabel ? 'label' : 'button'"
        class="button-base footer-button footer-button--load"
        :for="loadMainIsLabel ? 'load_input_vue' : null"
        @click="loadMainIsLabel ? null : handleLoadHub"
        :title="loadMainTitle"
      >
        データ読込
      </component>
      <input
        type="file"
        id="load_input_vue"
        @change="(e) => $emit('file-upload', e)"
        accept=".json,.txt,.zip"
        class="hidden"
      />
      <component
        v-if="config.loadAlt"
        :is="loadAltIsLabel ? 'label' : 'button'"
        class="button-base footer-button footer-button--cloud"
        :for="loadAltIsLabel ? 'load_input_vue' : null"
        @click="loadAltIsLabel ? null : handleLoadHub"
        :title="loadAltTitle"
      >
        <span
          v-if="config.loadAlt === 'openHub'"
          class="icon-svg icon-svg--footer icon-svg-download"
          aria-label="Cloud Hub"
        ></span>
        <span v-else>📤</span>
      </component>
    </div>
    <div class="button-base footer-button footer-button--output" @click="$emit('output')" ref="outputButton">
      {{ outputButtonText }}
    </div>
    <button
      class="button-base footer-button footer-button--share"
      :aria-label="isViewingShared ? '自分用にコピーして編集' : '共有'"
      @click="handleShareClick"
    >
      {{ isViewingShared ? '自分用にコピーして編集' : '共有' }}
    </button>
  </div>
</template>

<script setup>
import { ref, defineExpose, defineEmits, computed } from 'vue';
import { useFooterState } from '../../composables/useFooterState.js';

const props = defineProps({
  helpState: String,
  experienceStatusClass: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  outputButtonText: String,
  isViewingShared: Boolean,
});

const emit = defineEmits([
  'help-mouseover',
  'help-mouseleave',
  'help-click',
  'save',
  'save-to-drive',
  'file-upload',
  'open-hub',
  'output',
  'share',
  'copy-edit',
]);
const outputButton = ref(null);
const helpIcon = ref(null);

defineExpose({ outputButton, helpIcon });

const { config, canOperateDrive, isCloudSaveSuccess } = useFooterState();

const saveMainTitle = computed(() =>
  config.value.saveMain === 'cloudSave' ? 'Google Driveに保存' : 'ローカルに保存',
);
const saveAltTitle = computed(() => {
  if (config.value.saveAlt === 'cloudSave') return 'Google Driveに保存';
  if (config.value.saveAlt === 'localSave') return 'ローカルに保存';
  return '';
});
const loadMainTitle = computed(() =>
  config.value.loadMain === 'openHub' ? 'クラウド管理ハブ' : 'ローカルファイルを読み込む',
);
const loadAltTitle = computed(() => {
  if (config.value.loadAlt === 'openHub') return 'クラウド管理ハブ';
  if (config.value.loadAlt === 'localLoad') return 'ローカルファイルを読み込む';
  return '';
});
const loadMainIsLabel = computed(() => config.value.loadMain === 'localLoad');
const loadAltIsLabel = computed(() => config.value.loadAlt === 'localLoad');

function handleSaveMain() {
  if (config.value.saveMain === 'cloudSave') {
    emit('save-to-drive');
  } else {
    emit('save');
  }
}

function handleSaveAlt() {
  if (config.value.saveAlt === 'cloudSave') {
    emit('save-to-drive');
  } else if (config.value.saveAlt === 'localSave') {
    emit('save');
  }
}

function handleLoadHub() {
  emit('open-hub');
}

function handleShareClick() {
  if (props.isViewingShared) {
    emit('copy-edit');
  } else {
    emit('share');
  }
}
</script>

<style scoped>
</style>

