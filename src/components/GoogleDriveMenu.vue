<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        class="button-base icon-button"
        title="Google Drive Menu"
        v-if="props.isGapiInitialized && props.isGisInitialized"
        @click="toggleDriveMenuInternal"
        ref="driveMenuToggleButton"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Google Drive"></span>
      </button>
      <div class="floating-menu" v-if="showDriveMenu" ref="driveMenu">
        <div class="menu-item status-message" id="floating_drive_status_message">
          {{ props.driveStatusMessage }}
        </div>
        <button class="menu-item button-base" v-if="canSignInToGoogle" @click="handleSignIn">
          Sign In with Google
        </button>
        <button class="menu-item button-base" v-if="props.isSignedIn" @click="handleSignOut">
          Sign Out
        </button>
        <button class="menu-item button-base" v-if="props.isSignedIn" @click="handleChooseFolder" :disabled="!props.isSignedIn">
          Choose Drive Folder
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, defineProps, defineEmits, onBeforeUnmount } from 'vue';

const props = defineProps({
  isGapiInitialized: Boolean,
  isGisInitialized: Boolean,
  isSignedIn: Boolean,
  driveStatusMessage: String,
});

const emit = defineEmits([
  'sign-in',
  'sign-out',
  'choose-folder',
]);

const showDriveMenu = ref(false);
const driveMenuToggleButton = ref(null);
const driveMenu = ref(null);

const canSignInToGoogle = computed(() => props.isGapiInitialized && props.isGisInitialized && !props.isSignedIn);

const toggleDriveMenuInternal = () => {
  showDriveMenu.value = !showDriveMenu.value;
};

const handleSignIn = () => {
  showDriveMenu.value = false;
  emit('sign-in');
};

const handleSignOut = () => {
  showDriveMenu.value = false;
  emit('sign-out');
};

const handleChooseFolder = () => {
  showDriveMenu.value = false;
  emit('choose-folder');
};

let driveMenuClickListener = null;
watch(showDriveMenu, (newValue) => {
  if (newValue) {
    nextTick(() => {
      const menuEl = driveMenu.value;
      const toggleButtonEl = driveMenuToggleButton.value;
      if (menuEl && toggleButtonEl) {
        driveMenuClickListener = (event) => {
          if (!menuEl.contains(event.target) && !toggleButtonEl.contains(event.target)) {
            showDriveMenu.value = false;
          }
        };
        document.addEventListener('click', driveMenuClickListener, true);
      }
    });
  } else {
    if (driveMenuClickListener) {
      document.removeEventListener('click', driveMenuClickListener, true);
      driveMenuClickListener = null;
    }
  }
});

onBeforeUnmount(() => {
  if (driveMenuClickListener) {
    document.removeEventListener('click', driveMenuClickListener, true);
  }
});

</script>

<style scoped>
/* All styles for this component are defined in and imported globally from assets/css/_components.css */
/* Specifically under the sections: */
/* - "トップ左コントロール (Google Drive Button)" for .top-left-controls, .google-drive-button-container, .icon-button, .floating-menu, .menu-item */
/* - General .button-base styles */
/* - Icon styles like .icon-svg and .icon-svg-cloud */
</style>
