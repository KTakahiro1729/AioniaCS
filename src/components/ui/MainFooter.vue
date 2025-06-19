<template>
    <div class="main-footer">
        <div :class="['status-display', experienceStatusClass]">
            {{ experienceLabel }} {{ currentExperiencePoints }} /
            {{ maxExperiencePoints }}
        </div>
        <div class="footer-button-container">
            <button
                class="button-base footer-button footer-button--save"
                @click="$emit('save')"
                :title="saveTitle"
            >
                <span
                    class="icon-svg icon-svg--footer"
                    :class="saveIcon"
                ></span>
                {{ saveLabel }}
            </button>
        </div>
        <div class="footer-button-container">
            <label
                class="button-base footer-button footer-button--load"
                for="load_input_vue"
                :title="loadTitle"
            >
                <span
                    class="icon-svg icon-svg--footer"
                    :class="loadIcon"
                ></span>
                {{ loadLabel }}
            </label>
            <input
                type="file"
                id="load_input_vue"
                @change="(e) => $emit('file-upload', e)"
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
import { ref, defineExpose, defineEmits } from "vue";

const props = defineProps({
    experienceStatusClass: String,
    experienceLabel: String,
    currentExperiencePoints: Number,
    maxExperiencePoints: Number,
    currentWeight: Number,
    isViewingShared: Boolean,
    dataManager: Object,
    signIn: Function,
    saveTitle: String,
    saveLabel: String,
    saveIcon: String,
    loadTitle: String,
    loadLabel: String,
    loadIcon: String,
    ioLabel: String,
    shareLabel: String,
    copyEditLabel: String,
});

const emit = defineEmits(["save", "file-upload", "io", "share", "copy-edit"]);
</script>

<style scoped></style>
