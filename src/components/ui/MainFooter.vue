<template>
    <div class="main-footer">
        <div :class="['status-display', experienceStatusClass]">
            {{ experienceLabel }} {{ currentExperiencePoints }} /
            {{ maxExperiencePoints }}
        </div>
        <div class="footer-button-container">
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
        </div>
        <div class="footer-button-container">
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
        </div>
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

<style scoped></style>
