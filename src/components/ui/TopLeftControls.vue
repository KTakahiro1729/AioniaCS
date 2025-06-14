<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        class="button-base icon-button"
        title="Google Drive Menu"
        v-if="isGapiInitialized && isGisInitialized"
        @click="toggleMenu"
        ref="driveMenuToggleButton"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Google Drive"></span>
      </button>
      <div class="floating-menu" v-if="showMenu" ref="driveMenu">
        <button
          class="menu-item button-base"
          v-if="canSignInToGoogle"
          @click="handleSignIn"
        >
          Sign In with Google
        </button>
        <button
          class="menu-item button-base"
          v-if="isSignedIn"
          @click="handleSignOut"
        >
          Sign Out
        </button>
        <button
          class="menu-item button-base"
          v-if="isSignedIn"
          @click="handleChooseFolder"
          :disabled="!isSignedIn"
        >
          Choose Drive Folder
        </button>
      </div>
      <button
        class="button-base icon-button"
        v-if="isSignedIn"
        @click="$emit('open-hub')"
        title="クラウド管理ハブ"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Hub"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  isGapiInitialized: Boolean,
  isGisInitialized: Boolean,
  canSignInToGoogle: Boolean,
  isSignedIn: Boolean,
});

const emit = defineEmits(['sign-in', 'sign-out', 'choose-folder', 'open-hub']);

const showMenu = ref(false);
const driveMenuToggleButton = ref(null);
const driveMenu = ref(null);
let driveMenuClickListener = null;

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleSignIn() {
  showMenu.value = false;
  emit('sign-in');
}

function handleSignOut() {
  showMenu.value = false;
  emit('sign-out');
}

function handleChooseFolder() {
  showMenu.value = false;
  emit('choose-folder');
}

watch(showMenu, (newValue) => {
  if (driveMenuClickListener) {
    document.removeEventListener('click', driveMenuClickListener, true);
    driveMenuClickListener = null;
  }
  if (newValue) {
    nextTick(() => {
      const menuEl = driveMenu.value;
      const toggleButtonEl = driveMenuToggleButton.value;
      if (menuEl && toggleButtonEl) {
        driveMenuClickListener = (event) => {
          if (!menuEl.contains(event.target) && !toggleButtonEl.contains(event.target)) {
            showMenu.value = false;
          }
        };
        document.addEventListener('click', driveMenuClickListener, true);
      }
    });
  }
});
</script>

<style scoped>
</style>

