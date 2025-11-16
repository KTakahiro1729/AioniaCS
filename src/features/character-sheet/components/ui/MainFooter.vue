<template>
  <div class="main-footer">
    <div :class="['status-display', experienceStatusClass]">
      {{ experienceLabel }} {{ currentExperiencePoints }} /
      {{ maxExperiencePoints }}
    </div>
    <div class="main-footer__actions">
      <button class="button-base footer-button footer-button--load" @click="$emit('open-load-modal')" :title="loadButton.title">
        <span class="icon-svg icon-svg--footer" :class="loadButton.icon"></span>
        {{ loadButton.label }}
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
      <button class="button-base footer-button footer-button--save" @click="handleSave" :title="saveButton.title">
        <span class="icon-svg icon-svg--footer" :class="saveButton.icon"></span>
        {{ saveButton.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { useDynamicButtons } from '@/features/cloud-sync/composables/useDynamicButtons.js';

const props = defineProps({
  experienceStatusClass: String,
  experienceLabel: String,
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  currentWeight: Number,
  isViewingShared: Boolean,
  saveLocal: Function,
  saveToDrive: Function,
  outputLabel: String,
  shareLabel: String,
  copyEditLabel: String,
});

const emit = defineEmits(['open-load-modal', 'open-output-modal', 'share']);

const uiStore = useUiStore();
const { saveButton, loadButton } = useDynamicButtons();

const isShareDisabled = computed(() => !uiStore.isSignedIn && !props.isViewingShared);

function handleSave() {
  if (uiStore.isSignedIn) {
    props.saveToDrive();
  } else {
    props.saveLocal();
  }
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
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.main-footer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

.footer-button--output {
  width: 175px;
  user-select: none;
}

.footer-button--save,
.footer-button--load {
  width: 140px;
  flex-shrink: 0;
  justify-content: center;
}

.footer-button--save {
  padding: 0;
}

.footer-button--load {
  padding: 0;
}

.icon-svg--footer {
  width: 36px;
  height: 36px;
  margin: -3px;
  margin-right: 3px;
}

.button-base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
