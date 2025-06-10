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
/* Styles moved from _components.css */
/* Top Left Controls (Google Drive Button) */
.top-left-controls {
  position: fixed; /* Was fixed, but for component context, might be better as absolute if parent is positioned */
  /* For now, keeping as fixed as per original global style. Re-evaluate if it causes issues in App.vue layout. */
  top: 10px;
  left: 10px;
  z-index: 1050; /* Ensure this z-index is appropriate in the new stacking context */
}

.google-drive-button-container {
  position: relative;
}

/*
  The .icon-button styles in _components.css had two definitions.
  One general, and one specific under "トップ左コントロール".
  This component uses the specific one.
*/
.icon-button { /* Specific to Google Drive button in this context */
  padding: 16px;
  background-color: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 50%;
  display: inline-flex; /* Already part of .button-base */
  align-items: center; /* Already part of .button-base */
  justify-content: center; /* Already part of .button-base */
  width: 80px;
  height: 80px;
  box-shadow: 0 2px 5px rgb(0 0 0 / 20%);
  /* .button-base provides cursor, base border, transition, flex properties */
}

.icon-button:hover { /* Specific hover for Google Drive button */
  border-color: var(--color-accent); /* Overrides .button-base:hover potentially */
  background-color: var(--color-panel-header); /* Specific hover background */
  /* .button-base:hover also has color, box-shadow, text-shadow changes not included here */
  /* This might need merging/decision if .button-base effects are desired on this specific hover */
}

.icon-button .icon-svg { /* Specific sizing for the cloud icon within this button */
  width: 48px;
  height: 48px;
  /* General .icon-svg provides mask, bg-color, transition */
}

.icon-button:hover .icon-svg { /* Specific hover for the icon within this button */
  /* _components.css had border-color and background-color for icon-svg on hover. */
  /* SVG masks usually rely on the background-color of the element itself. */
  /* Assuming icon-svg is a span with mask, its background-color will change */
  background-color: var(--color-accent-light); /* Matched from original CSS */
}
/* End of specific .icon-button styles for Drive context */


.floating-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background-color: var(--color-panel-body);
  border: 1px solid var(--color-border-normal);
  border-radius: 4px;
  padding: 8px; /* from _components.css, was var(--spacing-xsmall) 0; in previous scoped */
  box-shadow: 0 4px 12px rgb(0 0 0 / 30%);
  z-index: 100; /* from _components.css, was var(--z-index-dropdown-menu) */
  min-width: 200px;
}

.floating-menu .menu-item {
  display: block;
  width: 100%;
  padding: 8px 12px; /* from _components.css, was var(--spacing-small) var(--spacing-medium) */
  margin-bottom: 4px; /* from _components.css */
  text-align: left;
  background-color: transparent;
  color: var(--color-text-normal); /* from _components.css, was var(--color-text-menu-item) */
  border: none;
  border-radius: 3px; /* from _components.css */
  font-size: var(--font-size-small); /* was already here */
  cursor: pointer; /* was already here */
}
/* This targets menu items that are also buttons */
.floating-menu .menu-item.button-base {
  width: calc(100% - 0px); /* Effectively 100%, from _components.css */
  margin-bottom: 4px; /* from _components.css */
  justify-content: flex-start; /* from _components.css for button-base menu items */
  /* .button-base provides other base styles if not overridden by .menu-item */
}


.floating-menu .menu-item:last-child {
  margin-bottom: 0;
}

.floating-menu .menu-item:hover:not(.status-message) {
  background-color: var(--color-panel-header); /* from _components.css, was var(--color-background-menu-hover) */
  color: var(--color-accent); /* from _components.css, was var(--color-text-menu-item-hover) */
}

.floating-menu .menu-item:disabled { /* Style from general .button-base:disabled might be more comprehensive */
  color: var(--color-text-disabled);
  cursor: not-allowed;
  background-color: transparent; /* Ensure no hover effect */
}


.floating-menu .status-message { /* This is a .menu-item with .status-message class */
  font-size: 0.85em; /* from _components.css, was var(--font-size-xsmall) */
  color: var(--color-text-muted); /* from _components.css */
  padding: 8px 12px; /* from _components.css, consistent with other menu items */
  border-bottom: 1px solid var(--color-border-normal); /* from _components.css */
  margin-bottom: 5px; /* from _components.css */
  cursor: default; /* was already here */
}
/* No hover for status message is implicitly handled by :not(.status-message) on the general hover rule */

/* General .icon-svg and .icon-svg-cloud are expected to be globally available */
/* from _components.css for their mask-image and base display properties if not overridden above. */
/* This component uses a specifically sized .icon-svg via .icon-button .icon-svg */

</style>
