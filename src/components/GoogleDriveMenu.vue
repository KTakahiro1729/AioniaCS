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
const driveMenuToggleButton = ref(null); // Template ref for the button
const driveMenu = ref(null); // Template ref for the menu itself

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
    // Use nextTick to ensure the menu is in the DOM before adding listener
    nextTick(() => {
      const menuEl = driveMenu.value;
      const toggleButtonEl = driveMenuToggleButton.value; // Ensure this ref is correctly assigned in template
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
/* Styles specific to .top-left-controls and .google-drive-button-container */
.top-left-controls {
  position: absolute;
  top: var(--spacing-small);
  left: var(--spacing-small);
  z-index: var(--z-index-floating-elements);
}

.google-drive-button-container {
  position: relative; /* For positioning the floating menu */
}

.icon-button { /* General style for icon buttons, can be global */
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: var(--button-padding-icon); /* Adjust as needed */
  background-color: var(--color-button-neutral-bg);
  border: 1px solid var(--color-button-neutral-border);
  border-radius: var(--border-radius-default);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.icon-button:hover {
  background-color: var(--color-button-neutral-hover-bg);
}

.icon-svg { /* Base for SVG icons */
  width: var(--icon-size-medium);
  height: var(--icon-size-medium);
  fill: currentColor; /* Or specific color */
  color: var(--color-icon-default); /* Example color */
}
.icon-svg:hover {
  color: var(--color-icon-hover);
}

.icon-svg-cloud { /* Specific icon, assuming it's an SVG or class for one */
  /* background-image: url(...); or use <svg> directly in template */
  /* For this example, assuming an SVG is inlined or handled by a global component */
   background-color: transparent; /* if it's a span with background */
}


/* Floating Menu Styles (copied from App.vue or defined as standard) */
.floating-menu {
  position: absolute;
  top: calc(100% + var(--spacing-xsmall)); /* Position below the button */
  left: 0;
  background-color: var(--color-background-menu);
  border: 1px solid var(--color-border-menu);
  border-radius: var(--border-radius-menu);
  box-shadow: var(--shadow-menu);
  min-width: 200px; /* Example min-width */
  z-index: var(--z-index-dropdown-menu); /* Ensure it's above other elements */
  padding: var(--spacing-xsmall) 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: var(--spacing-small) var(--spacing-medium);
  text-align: left;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-small);
  color: var(--color-text-menu-item);
}
.menu-item:hover {
  background-color: var(--color-background-menu-hover);
  color: var(--color-text-menu-item-hover);
}
.menu-item:disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
  background-color: transparent;
}

.menu-item.status-message {
  padding: var(--spacing-small) var(--spacing-medium);
  font-size: var(--font-size-xsmall);
  color: var(--color-text-muted);
  cursor: default;
  background-color: transparent; /* No hover effect for status */
}
.menu-item.status-message:hover {
  background-color: transparent; /* No hover effect for status */
}

/* Ensure .button-base is defined if used, or remove if menu items don't need it */
/* .button-base might imply other global styles not included here. */
/* For this component, menu-item provides base styling. */

</style>
