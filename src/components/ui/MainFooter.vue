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
        @click="$emit('save')"
        title="ローカルに保存"
      >
        [↓] 端末に保存
      </button>
    </div>
    <div class="footer-button-container">
      <label
        class="button-base footer-button footer-button--load"
        for="load_input_vue"
        title="ローカルファイルを読み込む"
      >
        [↑] 読み込み
      </label>
      <input
        type="file"
        id="load_input_vue"
        @change="(e) => $emit('file-upload', e)"
        accept=".json,.txt,.zip"
        class="hidden"
      />
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
import { ref, defineExpose, defineEmits } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';

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
  'file-upload',
  'output',
  'share',
  'copy-edit',
]);
const outputButton = ref(null);
const helpIcon = ref(null);

defineExpose({ outputButton, helpIcon });

const uiStore = useUiStore();

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

