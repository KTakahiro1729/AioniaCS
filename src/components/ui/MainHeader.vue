<template>
  <header class="main-header" ref="headerEl">
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

    <div class="main-header__title">{{ titleText }}</div>

    <button class="button-base icon-button" :title="accountIconLabel" @click="$emit('open-hub')">
      <span class="icon-svg icon-svg-elf" aria-label="account"></span>
    </button>
  </header>
</template>

<script setup>
import { ref, computed, defineExpose } from 'vue';
import { useHeaderVisibility } from '../../composables/useHeaderVisibility.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useAuth0 } from '@auth0/auth0-vue';

const { isAuthenticated } = useAuth0();

const props = defineProps({
  helpState: String,
  defaultTitle: String,
  cloudHubLabel: String,
  helpLabel: String,
});

const emit = defineEmits(['open-hub', 'help-mouseover', 'help-mouseleave', 'help-click']);

const headerEl = ref(null);
const helpIcon = ref(null);

const characterStore = useCharacterStore();

useHeaderVisibility(headerEl);

const titleText = computed(() => characterStore.character.name || props.defaultTitle);
const accountIconLabel = computed(() => (isAuthenticated.value ? props.cloudHubLabel : 'ログイン'));

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

.main-header__title {
  flex: 1;
  text-align: center;
  font-family: 'Cinzel Decorative', 'Shippori Mincho', serif;
  color: var(--color-accent);
  font-size: min(4vw, 30px);
}

.google-drive-button-container {
  position: relative;
}

.icon-button {
  padding: 8px;
  background-color: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  box-shadow: 0 2px 5px rgb(0 0 0 / 20%);
}

.icon-button:hover {
  border-color: var(--color-accent);
  background-color: var(--color-panel-header);
}

.icon-button .icon-svg {
  width: 48px;
  height: 48px;
}

.icon-button:hover .icon-svg {
  border-color: var(--color-accent-light);
  background-color: var(--color-accent-light);
}

.header-help-icon {
  cursor: pointer;
  font-size: 25px;
  font-weight: 400;
  width: 50px;
  height: 50px;
}

.header-help-icon--fixed,
.header-help-icon--fixed:hover {
  background-color: var(--color-accent-dark);
}
</style>
