<script setup>
import { ref } from 'vue';

const props = defineProps({
  showDriveMenu: Boolean,
  driveStatusMessage: String,
  canSignInToGoogle: Boolean,
  isSignedIn: Boolean,
});
const emit = defineEmits([
  'toggleDriveMenu',
  'signIn',
  'signOut',
  'chooseDriveFolder',
]);

const driveMenuToggleButton = ref(null);
const driveMenu = ref(null);

defineExpose({ driveMenuToggleButton, driveMenu });
</script>
<template>
  <div class="top-left-controls">
    <div class="google-drive-button-container">
      <button
        ref="driveMenuToggleButton"
        class="button-base icon-button"
        title="Google Drive Menu"
        @click="emit('toggleDriveMenu')"
      >
        <span class="icon-svg icon-svg-cloud" aria-label="Google Drive"></span>
      </button>
      <div class="floating-menu" v-if="props.showDriveMenu" ref="driveMenu">
        <div class="menu-item status-message" id="floating_drive_status_message">
          {{ props.driveStatusMessage }}
        </div>
        <button class="menu-item button-base" v-if="props.canSignInToGoogle" @click="emit('signIn')">
          Sign In with Google
        </button>
        <button class="menu-item button-base" v-if="props.isSignedIn" @click="emit('signOut')">
          Sign Out
        </button>
        <button class="menu-item button-base" v-if="props.isSignedIn" @click="emit('chooseDriveFolder')" :disabled="!props.isSignedIn">
          Choose Drive Folder
        </button>
      </div>
    </div>
  </div>
  <div class="tool-title">Aionia TRPG Character Sheet</div>
</template>
