<template>
  <header class="main-header" ref="headerEl">
    <div class="main-header__section main-header__section--left">
      <button class="button-base main-header__button" @click="handleNewCharacterClick">
        {{ newCharacterLabel }}
      </button>
    </div>
    <div class="main-header__title">{{ titleText }}</div>
    <div class="main-header__section main-header__section--right">
      <button class="button-base main-header__button" @click="handleAuthClick">
        {{ isSignedIn ? signOutLabel : signInLabel }}
      </button>
      <button
        class="button-base header-help-icon"
        ref="helpIcon"
        :class="{ 'header-help-icon--fixed': helpState === 'fixed' }"
        @mouseover="$emit('help-mouseover')"
        @mouseleave="$emit('help-mouseleave')"
        @click="$emit('help-click')"
        type="button"
      >
        {{ helpLabel }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
import { useHeaderVisibility } from '@/shared/composables/useHeaderVisibility.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';

const props = defineProps({
  helpState: String,
  defaultTitle: String,
  helpLabel: String,
  newCharacterLabel: String,
  signInLabel: String,
  signOutLabel: String,
});

const emit = defineEmits(['new-character', 'help-mouseover', 'help-mouseleave', 'help-click', 'sign-in', 'sign-out']);

const headerEl = ref(null);
const helpIcon = ref(null);

const characterStore = useCharacterStore();
const uiStore = useUiStore();

useHeaderVisibility(headerEl);

const titleText = computed(() => characterStore.character.name || props.defaultTitle);
const isSignedIn = computed(() => uiStore.isSignedIn);

function handleNewCharacterClick() {
  emit('new-character', { isSignedIn: isSignedIn.value });
}

function handleAuthClick() {
  emit(isSignedIn.value ? 'sign-out' : 'sign-in');
}

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
  height: 80px;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border-normal);
  box-shadow: 0 3px 8px rgb(0 0 0 / 50%);
  z-index: 101;
  will-change: transform;
}

.main-header__section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.main-header__section--left {
  justify-content: flex-start;
}

.main-header__section--right {
  justify-content: flex-end;
}

.main-header__button {
  min-width: 50px;
  height: 50px;
  justify-content: center;
}

.main-header__title {
  text-align: center;
  font-family: 'Cinzel Decorative', 'Shippori Mincho', serif;
  color: var(--color-accent);
  font-size: clamp(2px, 3vw, 28px);
  flex: 1.5;
  min-width: 0;
  padding: 0 10px;
}

.header-help-icon {
  width: 50px;
  height: 50px;
  font-size: 25px;
  font-weight: 400;
  padding: 0;
}

.header-help-icon--fixed,
.header-help-icon--fixed:hover {
  background-color: var(--color-accent-dark);
}

@media (max-width: 400px) {
  .main-header__title {
    display: none;
  }
}
</style>
