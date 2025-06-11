<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        class="button-base icon-button"
        :title="isSignedIn ? driveMessages.ui.driveMenuTitleSignedIn : driveMessages.ui.driveMenuTitle"
        :aria-label="isSignedIn ? driveMessages.ui.driveMenuAriaLabelSignedIn : driveMessages.ui.driveMenuAriaLabel"
        v-if="isGapiInitialized && isGisInitialized"
        @click="toggleMenu"
        ref="driveMenuToggleButton"
      >
        <span class="icon-svg icon-svg-cloud" aria-hidden="true"></span>
      </button>
      <div class="floating-menu" v-if="showMenu" ref="driveMenu">
        <div class="menu-item status-message" id="floating_drive_status_message">
          {{ driveStatusMessage }}
        </div>
        <button
          class="menu-item button-base"
          v-if="canSignInToGoogle"
          @click="handleSignIn"
        >
          {{ driveMessages.ui.signIn }}
        </button>
        <button
          class="menu-item button-base"
          v-if="isSignedIn"
          @click="handleSignOut"
        >
          {{ driveMessages.ui.signOut }}
        </button>
        <button
          class="menu-item button-base"
          v-if="isSignedIn"
          @click="handleChooseFolder"
          :disabled="!isSignedIn"
        >
          {{ driveMessages.ui.chooseFolder }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { DriveMessages as driveMessages } from '../../data/driveMessages.js';

const props = defineProps({
  isGapiInitialized: Boolean,
  isGisInitialized: Boolean,
  driveStatusMessage: String,
  canSignInToGoogle: Boolean,
  isSignedIn: Boolean,
});

const emit = defineEmits(['sign-in', 'sign-out', 'choose-folder']);

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

