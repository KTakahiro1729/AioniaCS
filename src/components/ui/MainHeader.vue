<template>
    <header
        class="main-header"
        :class="{ 'main-header--hidden': !uiStore.showHeader }"
        ref="headerEl"
    >
        <button
            class="button-base icon-button"
            :title="cloudHubLabel"
            @click="$emit('open-hub')"
        >
            <span class="icon-svg icon-svg-cloud" aria-label="cloud"></span>
        </button>
        <div class="main-header__title">{{ titleText }}</div>
        <div
            class="button-base header-help-icon"
            ref="helpIcon"
            :class="{ 'header-help-icon--fixed': helpState === 'fixed' }"
            @mouseover="$emit('help-mouseover')"
            @mouseleave="$emit('help-mouseleave')"
            @click="$emit('help-click')"
            tabindex="0"
        >
            {{ helpLabel }}
        </div>
    </header>
</template>

<script setup>
import { ref, computed, defineExpose } from "vue";
import { useUiStore } from "../../stores/uiStore.js";
import { useCharacterStore } from "../../stores/characterStore.js";

const props = defineProps({
    helpState: String,
    defaultTitle: String,
    cloudHubLabel: String,
    helpLabel: String,
});

const emit = defineEmits([
    "open-hub",
    "help-mouseover",
    "help-mouseleave",
    "help-click",
]);

const headerEl = ref(null);
const helpIcon = ref(null);

const uiStore = useUiStore();
const characterStore = useCharacterStore();

const titleText = computed(
    () => characterStore.character.name || props.defaultTitle
);

defineExpose({ headerEl, helpIcon });
</script>

<style scoped>
.main-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: var(--color-background);
    border-bottom: 1px solid var(--color-border-normal);
    box-shadow: 0 3px 8px rgb(0 0 0 / 50%);
    z-index: 101;
    transition: transform 0.3s ease;
}
.main-header--hidden {
    transform: translateY(-100%);
}
.main-header__title {
    flex: 1;
    text-align: center;
    font-family: "Cinzel Decorative", cursive;
    color: var(--color-accent);
    font-size: 1.5em;
}
.header-help-icon {
    cursor: pointer;
    font-size: 25px;
    font-weight: 400;
    /* padding: 6px 8px; */
    width: 60px;
    height: 60px;
}
.header-help-icon--fixed,
.header-help-icon--fixed:hover {
    background-color: var(--color-accent-dark);
}
</style>
