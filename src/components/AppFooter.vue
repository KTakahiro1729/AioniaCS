<template>
  <div class="main-footer">
    <div
      class="button-base footer-help-icon"
      :class="{ 'footer-help-icon--fixed': props.helpState === 'fixed' }"
      @mouseover="onHelpIconMouseOver"
      @mouseleave="onHelpIconMouseLeave"
      @click="onHelpIconClick"
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
      <button
        class="button-base footer-button footer-button--save"
        @click="onSaveDataLocal"
      >
        データ保存
      </button>
      <button
        v-if="props.isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="onSaveDataDrive"
        :disabled="!props.canOperateDrive"
        title="Google Driveに保存"
      >
          <span v-if="props.isCloudSaveSuccess" class="icon-svg icon-svg--footer icon-svg-success" aria-label="Save Succeeded"></span>
          <span v-else class="icon-svg icon-svg--footer icon-svg-upload" aria-label="Save to Drive"></span>
      </button>
    </div>
    <div class="footer-button-container">
      <label @click="onTriggerLoadDataLocal" class="button-base footer-button footer-button--load">データ読込</label>
      <button
        v-if="props.isSignedIn"
        class="button-base footer-button footer-button--cloud"
        @click="onLoadDataDrive"
        :disabled="!props.isSignedIn"
        title="Google Driveから読込"
      >
          <span class="icon-svg icon-svg--footer icon-svg-download" aria-label="Load from Drive"></span>
      </button>
    </div>
    <div class="button-base footer-button footer-button--output" @click="handleOutputToCocofolia" ref="outputButtonRef">
      {{ localOutputButtonText }}
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  currentExperiencePoints: Number,
  maxExperiencePoints: Number,
  experienceStatusClass: String,
  currentWeight: Number,
  isSignedIn: Boolean,
  canOperateDrive: Boolean,
  isCloudSaveSuccess: Boolean,
  outputButtonText: String,
  helpState: String,
  AioniaGameData: {
    type: Object,
    required: true
  },
});

const emit = defineEmits([
  'help-icon-mouseover',
  'help-icon-mouseleave',
  'help-icon-click',
  'save-data-local',
  'save-data-drive',
  'trigger-load-data-local',
  'load-data-drive',
  'output-cocofolia',
]);

const outputButtonRef = ref(null);
const localOutputButtonText = ref(props.outputButtonText);

watch(() => props.outputButtonText, (newVal) => {
  if (!outputButtonRef.value || !outputButtonRef.value.classList.contains("is-animating")) {
    localOutputButtonText.value = newVal;
  }
});

const playOutputAnimation = () => {
  const button = outputButtonRef.value;
  if (!button || button.classList.contains("is-animating")) return;

  const buttonMessages = props.AioniaGameData.uiMessages.outputButton;
  const timings = buttonMessages.animationTimings;

  button.classList.add("is-animating", "state-1");

  setTimeout(() => {
    button.classList.remove("state-1");
    localOutputButtonText.value = buttonMessages.animating;
    button.classList.add("state-2");
  }, timings.state1_bgFill);

  setTimeout(() => {
    button.classList.remove("state-2");
    button.classList.add("state-3");
  }, timings.state1_bgFill + timings.state2_textHold);

  setTimeout(() => {
    button.classList.remove("state-3");
    localOutputButtonText.value = buttonMessages.default;
    button.classList.add("state-4");
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut);

  setTimeout(() => {
    button.classList.remove("is-animating", "state-4");
    if (localOutputButtonText.value !== props.outputButtonText) {
        localOutputButtonText.value = props.outputButtonText;
    }
  }, timings.state1_bgFill + timings.state2_textHold + timings.state3_textFadeOut + timings.state4_bgReset);
};

defineExpose({
  playOutputAnimation,
});

const onHelpIconMouseOver = () => emit('help-icon-mouseover');
const onHelpIconMouseLeave = () => emit('help-icon-mouseleave');
const onHelpIconClick = () => emit('help-icon-click');
const onSaveDataLocal = () => emit('save-data-local');
const onSaveDataDrive = () => emit('save-data-drive');
const onTriggerLoadDataLocal = () => emit('trigger-load-data-local');
const onLoadDataDrive = () => emit('load-data-drive');

const handleOutputToCocofolia = () => {
  emit('output-cocofolia');
};

</script>

<style scoped>
/* Styles moved from _layout.css */
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
  z-index: 100; /* Was 100 in global, ensure this is correct relative to other z-indexed items */
  box-shadow: 0 -3px 8px rgb(0 0 0 / 50%);
  flex-wrap: nowrap; /* Changed from 'wrap' in original scoped to 'nowrap' from global */
  overflow-x: auto;
  gap: 15px;
  -webkit-overflow-scrolling: touch; /* For momentum scrolling on iOS */
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: var(--color-border-normal) var(--color-background); /* For Firefox */
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

/* Styles moved from _components.css */
.footer-help-icon {
  cursor: help;
  height: 48px;
  padding: 0 14px;
  font-size: 1.1em;
  font-weight: bold;
  background-color: var(--color-panel-body);
  color: var(--color-accent);
  min-height: 42px; /* from _components.css */
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%); /* from _components.css */
  /* .button-base provides other base styles */
}

.footer-help-icon--fixed,
.footer-help-icon--fixed:hover { /* :hover was on fixed variant in global */
  background-color: var(--color-accent-dark);
}

.status-display {
  padding: 7px 14px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9em;
  display: inline-block; /* from _components.css */
  border-width: 2px; /* from _components.css */
  border-style: solid; /* from _components.css */
  box-shadow: 0 0 5px rgb(0 0 0 / 30%) inset; /* from _components.css */
  white-space: nowrap; /* from _components.css */
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

.status-display--weight {
  border-color: var(--color-status-weight-border);
  color: var(--color-status-weight-text);
  background-color: var(--color-status-weight-bg);
}

.footer-button { /* This is a modifier for .button-base */
  padding: 10px 18px;
  font-size: 0.95em;
  height: 48px; /* from _components.css */
  font-weight: 700; /* from _components.css */
  text-align: center; /* from _components.css */
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%); /* from _components.css */
  min-height: 42px; /* from _components.css */
  box-sizing: border-box; /* from _components.css */
  white-space: nowrap; /* from _components.css */
}

.footer-button--load { /* Modifier for .button-base */
  padding: 0; /* from _components.css, to allow label to fill */
}
/* The label inside .footer-button--load needs its own styling if it's not button-base */
/* In _components.css, it was:
   .footer-button--load > label { ... }
   This needs to be replicated here if the label is not itself a button-base */
.footer-button--load > label { /* Copied from _components.css */
  color: inherit; /* To inherit from .button-base */
  font-weight: 700;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
  cursor: pointer; /* Make label look clickable */
}


.footer-button--output { /* Modifier for .button-base */
  width: 175px; /* from _components.css */
  user-select: none; /* from _components.css */
}

.footer-button--output.is-animating { /* from _components.css */
  pointer-events: none;
}

/* Animation states for output button */
.footer-button--output.state-1 {
  transition:
    background-color 0.5s ease-in-out,
    color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}

.footer-button--output.state-2 {
  transition: color 0.1s ease-in;
  background-color: var(--color-accent-light);
  color: var(--color-background);
}

.footer-button--output.state-3 {
  transition: color 0.5s ease-in-out;
  background-color: var(--color-accent-light);
  color: var(--color-accent-light);
}

.footer-button--output.state-4 {
  transition:
    background-color 0.7s ease-in-out,
    color 0.2s ease-in-out 0.5s;
  background-color: transparent;
  color: var(--color-accent);
}


.footer-button-container {
  position: relative; /* from _components.css */
  display: flex; /* from _components.css */
  align-items: stretch; /* from _components.css */
}

.footer-button--save,
label.footer-button--load { /* from _components.css, targeting the label specifically if it's not button-base */
  width: 120px;
  flex-shrink: 0;
  justify-content: center; /* for button-base content */
}


.footer-button-container > .button-base:not(:last-child) { /* from _components.css */
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.footer-button--cloud { /* Modifier for .button-base */
  padding: 0 12px; /* from _components.css */
  border-top-left-radius: 0; /* from _components.css */
  border-bottom-left-radius: 0; /* from _components.css */
  margin-left: -1px; /* from _components.css */
}

.icon-svg--footer { /* from _components.css */
  width: 35px;
  height: 35px;
  /* General .icon-svg class (mask, bg-color) should be available globally */
}

.footer-button--cloud:hover .icon-svg--footer { /* from _components.css */
  background-color: var(--color-accent-light) !important; /* Use !important if needed to override general .icon-svg hover */
}

/* Responsive styles from _layout.css specific to .main-footer might need to be here too */
/* Or ensure they are general enough to not need moving if they affect App.vue's root scrollbar too */
@media (max-width: 768px) {
  .main-footer {
    padding: 10px 15px;
    gap: 10px;
  }
  /* Adjustments for footer buttons if they were in the @media block in _layout.css */
  /* .footer-button-container > .footer-button, .footer-button--dropdown-arrow { height: 42px; } */
  /* .footer-button--save, .footer-button--load { width: 90px; } */
  /* .footer-button--output { width: 140px; } */
  /* These specific overrides are now part of the main rules above or handled by base button sizing */
}

</style>
