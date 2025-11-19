<template>
  <div class="main-footer">
    <div :class="['status-display', experienceStatusClass]">
      {{ experienceLabel }} {{ currentExperiencePoints }} /
      {{ maxExperiencePoints }}
    </div>
    <button class="button-base footer-button footer-button--load" @click="$emit('open-load-modal')" :title="loadLabel">
      <span class="icon-svg icon-svg--footer" :class="loadIconClass"></span>
      {{ loadLabel }}
    </button>
    <button class="button-base footer-button footer-button--output" @click="$emit('open-output-modal')">
      <span class="icon-svg icon-svg--footer icon-svg-io"></span>
      {{ outputLabel }}
    </button>
    <button
      class="button-base footer-button footer-button--share"
      :aria-label="isViewingShared ? copyEditLabel : shareLabel"
      :disabled="isShareDisabled"
      @click="handleShareClick"
    >
      <span class="icon-svg icon-svg--footer icon-svg-share"></span>
      {{ isViewingShared ? copyEditLabel : shareLabel }}
    </button>
    <button class="button-base footer-button footer-button--save" :disabled="isSaveDisabled" @click="handleSave" :title="saveLabel">
      <span class="icon-svg icon-svg--footer" :class="saveIconClass"></span>
      {{ saveLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const props = defineProps({
  experienceStatusClass: String,
  experienceLabel: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  isViewingShared: Boolean,
  saveToDrive: Function,
  outputLabel: String,
  shareLabel: String,
  copyEditLabel: String,
  loadLabel: String,
  saveLabel: String,
});

const emit = defineEmits(['open-load-modal', 'open-output-modal', 'share']);

const uiStore = useUiStore();

const isShareDisabled = computed(() => !uiStore.isSignedIn && !props.isViewingShared);
const isSaveDisabled = computed(() => !uiStore.isSignedIn);
const loadIconClass = computed(() => (uiStore.isSignedIn ? 'icon-svg-cloud-download' : 'icon-svg-local-upload'));
const saveIconClass = computed(() => 'icon-svg-cloud-upload');

function handleSave() {
  if (isSaveDisabled.value) {
    return;
  }
  props.saveToDrive();
}

function handleShareClick() {
  if (isShareDisabled.value) {
    return;
  }
  emit('share');
}
</script>

<style scoped>
.main-footer {
  display: flex;
  align-items: center;
  padding: 15px 25px;
  border-top: 1px solid var(--color-border-normal);
  background-color: var(--color-background);
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  box-shadow: 0 -3px 8px rgb(0 0 0 / 50%);
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 15px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-normal) var(--color-background);
}

.main-footer::-webkit-scrollbar {
  height: 8px;
}

.main-footer::-webkit-scrollbar-track {
  background: var(--color-background);
  border-radius: 4px;
}

.main-footer::-webkit-scrollbar-thumb {
  background: var(--color-border-normal);
  border-radius: 4px;
}

.main-footer::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

.footer-button {
  width: 100px;
  flex-shrink: 0;
  justify-content: center;
}

.status-display {
  padding: 7px 14px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9em;
  display: inline-block;
  border-width: 2px;
  border-style: solid;
  white-space: nowrap;
}

.status-display--experience-ok {
  border-color: var(--color-status-experience-ok-border);
  color: var(--color-status-experience-ok-text);
  background-color: var(--color-status-experience-ok-bg);
}

.status-display--experience-over {
  border-color: var(--color-status-experience-over-border);
  color: var(--color-status-experience-over-text);
  background-color: var(--color-status-experience-over-bg);
}

.icon-svg--footer {
  width: 30px;
  height: 30px;
  margin: -3px;
  margin-right: 3px;
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .main-footer {
    padding: 10px 15px;
    gap: 10px;
  }
}
</style>
