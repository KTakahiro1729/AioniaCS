<template>
  <div class="top-left-controls">
    <button class="menu-button" ref="driveMenuToggleButton" @click="emit('toggle-drive')">≡</button>
    <div class="floating-menu" v-if="show" ref="driveMenu">
      <div class="menu-item status-message" id="floating_drive_status_message">{{ statusMessage }}</div>
      <button class="menu-item button-base" v-if="canSignIn" @click="emit('sign-in')">Sign In with Google</button>
      <button class="menu-item button-base" v-if="signedIn" @click="emit('sign-out')">Sign Out</button>
      <button class="menu-item button-base" v-if="signedIn" @click="emit('choose-folder')" :disabled="!signedIn">Choose Drive Folder</button>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ show: Boolean, statusMessage: String, canSignIn: Boolean, signedIn: Boolean });
const emit = defineEmits(['toggle-drive', 'sign-in', 'sign-out', 'choose-folder']);
</script>
