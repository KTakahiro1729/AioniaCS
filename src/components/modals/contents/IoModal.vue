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
        <button class="button-base" @click="$emit('output-cocofolia')">
            {{ outputLabel }}
        </button>
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
const props = defineProps({
    signedIn: Boolean,
    saveLocalLabel: String,
    loadLocalLabel: String,
    outputLabel: String,
    printLabel: String,
    driveFolderLabel: String,
});
const emit = defineEmits([
    "save-local",
    "load-local",
    "output-cocofolia",
    "print",
    "drive-folder",
]);
</script>

<style scoped>
.io-modal {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
