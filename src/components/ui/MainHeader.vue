<template>
  <div :class="['main-header', { 'main-header--hidden': !headerVisible }]" ref="headerRef">
    <button
      v-if="uiStore.isSignedIn"
      class="button-base icon-button"
      title="Cloud Hub"
      @click="$emit('open-hub')"
    >
      <span class="icon-svg icon-svg-cloud" aria-label="Cloud"></span>
    </button>
    <div class="main-header__title">{{ title }}</div>
    <div
      class="footer-help-icon"
      @mouseover="$emit('help-mouseover')"
      @mouseleave="$emit('help-mouseleave')"
      @click="$emit('help-click')"
      tabindex="0"
    >
      ？
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useCharacterStore } from '../../stores/characterStore.js';

const emit = defineEmits(['open-hub', 'help-mouseover', 'help-mouseleave', 'help-click']);
const uiStore = useUiStore();
const characterStore = useCharacterStore();

const title = ref('Aionia TRPG Character Sheet');
const headerRef = ref(null);

watch(
  () => characterStore.character.name,
  (val) => {
    if (val) {
      title.value = val;
      document.title = val;
    }
  },
  { immediate: true },
);

const headerVisible = ref(true);
let lastScroll = 0;
function onScroll() {
  const y = window.scrollY || window.pageYOffset;
  if (y > lastScroll && y > 50) {
    headerVisible.value = false;
  } else if (y < lastScroll) {
    headerVisible.value = true;
  }
  lastScroll = y;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
</style>

