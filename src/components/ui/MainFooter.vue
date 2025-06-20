<template>
    <div class="main-footer">
        <div :class="['status-display', experienceStatusClass]">
            {{ experienceLabel }} {{ currentExperiencePoints }} /
            {{ maxExperiencePoints }}
        </div>
        <button
            class="button-base footer-button footer-button--save"
            @click="handleSave"
            :title="saveButton.title"
        >
            <span
                class="icon-svg icon-svg--footer"
                :class="saveButton.icon"
            ></span>
            {{ saveButton.label }}
        </button>
        <label
            v-if="!uiStore.isSignedIn"
            class="button-base footer-button footer-button--load"
            for="load_input_vue"
            :title="loadButton.title"
        >
            <span
                class="icon-svg icon-svg--footer"
                :class="loadButton.icon"
            ></span>
            {{ loadButton.label }}
        </label>
        <button
            v-else
            class="button-base footer-button footer-button--load"
            @click="props.openHub"
            :title="loadButton.title"
        >
            <span
                class="icon-svg icon-svg--footer"
                :class="loadButton.icon"
            ></span>
            {{ loadButton.label }}
        </button>
        <input
            v-if="!uiStore.isSignedIn"
            type="file"
            id="load_input_vue"
            @change="(e) => props.handleFileUpload(e)"
            accept=".json,.txt,.zip"
            class="hidden"
        />
        <button
            class="button-base footer-button footer-button--io"
            @click="$emit('io')"
        >
            <span class="icon-svg icon-svg--footer icon-svg-io"></span>
            {{ ioLabel }}
        </button>
        <button
            class="button-base footer-button footer-button--share"
            :aria-label="isViewingShared ? copyEditLabel : shareLabel"
            @click="$emit('share')"
        >
            <span class="icon-svg icon-svg--footer icon-svg-share"></span>
            {{ isViewingShared ? copyEditLabel : shareLabel }}
        </button>
    </div>
</template>

<script setup>
import { defineProps } from "vue";
import { useUiStore } from "../../stores/uiStore.js";
import { useDynamicButtons } from "../../composables/useDynamicButtons.js";

const props = defineProps({
    experienceStatusClass: String,
    experienceLabel: String,
    currentExperiencePoints: Number,
    maxExperiencePoints: Number,
    currentWeight: Number,
    isViewingShared: Boolean,
    saveLocal: Function,
    handleFileUpload: Function,
    openHub: Function,
    saveToDrive: Function,
    ioLabel: String,
    shareLabel: String,
    copyEditLabel: String,
});

const uiStore = useUiStore();
const { saveButton, loadButton } = useDynamicButtons();

function handleSave() {
    if (uiStore.isSignedIn) {
        props.saveToDrive();
    } else {
        props.saveLocal();
    }
}
</script>

<style scoped>


.status-display {
  padding: 7px 14px;
  border-radius: 3px;
  font-weight: bold;
  font-size: 0.9em;
  display: inline-block;
  border-width: 2px;
  border-style: solid;
  box-shadow: 0 0 5px rgb(0 0 0 / 30%) inset;
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



.footer-button--load {
  padding: 0;
}

.footer-button--output {
  width: 175px;
  user-select: none;
}


.footer-button-container {
  position: relative;
  display: flex;
  align-items: stretch;
}

.footer-button--save,
.footer-button--load {
  width: 120px;
  flex-shrink: 0;
  justify-content: center;
}

.footer-button--save {
  padding: 0;
}

.footer-button--cloud {
  padding: 0 12px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}


.icon-svg--footer {
  width: 36px;
  height: 36px;
  margin: -3px;
  margin-right: 3px;
}

.icon-svg--footer:hover .icon-svg--footer {
  background-color: var(--color-accent-light);
}

</style>
