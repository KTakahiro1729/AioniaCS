<template>
    <div class="io-modal">
        <button class="button-base" @click="$emit('save-local')">
            {{ saveLocalLabel }}
        </button>
        <label class="button-base">
            {{ loadLocalLabel }}
            <input
                type="file"
                class="hidden"
                @change="(e) => $emit('load-local', e)"
                accept=".json,.txt,.zip"
            />
        </label>
        <AnimatedButton
            class="button-base"
            :trigger="triggerKey"
            :default-label="outputLabels.default"
            :animating-label="outputLabels.animating"
            :success-label="outputLabels.success"
            :timings="outputTimings"
            @click="$emit('output-cocofolia')"
        />
        <button class="button-base" @click="$emit('print')">
            {{ printLabel }}
        </button>
        <button
            class="button-base"
            v-if="signedIn"
            @click="$emit('drive-folder')"
        >
            {{ driveFolderLabel }}
        </button>
    </div>
</template>

<script setup>
import { ref, defineExpose } from 'vue';
import AnimatedButton from '../../common/AnimatedButton.vue';

const props = defineProps({
    signedIn: Boolean,
    saveLocalLabel: String,
    loadLocalLabel: String,
    outputLabels: Object,
    outputTimings: Object,
    printLabel: String,
    driveFolderLabel: String,
});
const emit = defineEmits([
    'save-local',
    'load-local',
    'output-cocofolia',
    'print',
    'drive-folder',
]);

const triggerKey = ref(0);
function triggerAnimation() {
    triggerKey.value += 1;
}

defineExpose({ triggerAnimation });
</script>

<style scoped>
.io-modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
