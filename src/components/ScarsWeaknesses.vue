<template>
  <div id="scar_weakness_section" class="scar-weakness">
    <div class="box-title">傷痕と弱点</div>
    <div class="box-content">
      <div class="scar-section">
        <div class="sub-box-title sub-box-title--scar">傷痕</div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <div class="link-checkbox-container">
              <label for="current_scar" class="link-checkbox-main-label">現在値</label>
              <input
                type="checkbox"
                id="link_current_to_initial_scar_checkbox"
                v-model="editableCharacter.linkCurrentToInitialScar"
                class="link-checkbox"
                @change="emitCharacterUpdate"
              />
              <label for="link_current_to_initial_scar_checkbox" class="link-checkbox-label">連動</label>
            </div>
            <input
              type="number"
              id="current_scar"
              v-model.number="editableCharacter.currentScar"
              @input="handleCurrentScarInput"
              @change="emitCharacterUpdate"
              :class="{'greyed-out': editableCharacter.linkCurrentToInitialScar}"
              min="0"
              class="scar-section__current-input"
            />
          </div>
          <div class="info-item info-item--double">
            <label for="initial_scar">初期値</label>
            <input
              type="number"
              id="initial_scar"
              v-model.number="editableCharacter.initialScar"
              min="0"
              @change="emitCharacterUpdate"
            />
          </div>
        </div>
      </div>
      <div class="weakness-section">
        <div class="sub-box-title sub-box-title--weakness">弱点</div>
        <ul class="weakness-list list-reset">
          <li class="base-list-header">
            <div class="flex-weakness-number base-list-header-placeholder"></div>
            <div class="flex-weakness-text"><label>弱点</label></div>
            <div class="flex-weakness-acquired"><label>獲得</label></div>
          </li>
          <li v-for="(weakness, index) in editableCharacter.weaknesses" :key="index" class="base-list-item">
            <div class="flex-weakness-number">{{ index + 1 }}</div>
            <div class="flex-weakness-text">
              <input type="text" v-model="weakness.text" @change="emitCharacterUpdate" />
            </div>
            <div class="flex-weakness-acquired">
              <select v-model="weakness.acquired" @change="emitCharacterUpdate">
                <option
                  v-for="option in sessionNamesForWeaknessDropdown"
                  :key="option.value"
                  :value="option.value"
                  :disabled="option.disabled"
                >{{ option.text }}</option>
              </select>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, defineProps, defineEmits, nextTick } from 'vue';

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  histories: {
    type: Array,
    required: true,
  },
  AioniaGameData: { // Passed from App.vue
    type: Object,
    required: true,
  }
});

const emit = defineEmits(['update:character']);

// Create a local, editable copy of the character prop
const editableCharacter = reactive(JSON.parse(JSON.stringify(props.character)));

// Watch for changes in the prop and update the local copy
watch(() => props.character, (newCharacterData) => {
  Object.assign(editableCharacter, JSON.parse(JSON.stringify(newCharacterData)));
}, { deep: true });


const emitCharacterUpdate = () => {
  // When local data changes, emit an event to update the parent.
  // Send a deep clone to avoid reactivity issues.
  emit('update:character', JSON.parse(JSON.stringify(editableCharacter)));
};


const sessionNamesForWeaknessDropdown = computed(() => {
  // Ensure AioniaGameData and its properties are accessed correctly via props
  const defaultOptions = [...props.AioniaGameData.weaknessAcquisitionOptions];
  const sessionOptions = props.histories
    .map((h) => h.sessionName)
    .filter((name) => name && name.trim() !== '')
    .map((name) => ({ value: name, text: name, disabled: false }));
  const helpOption = {
    value: 'help-text',
    text: props.AioniaGameData.uiMessages.weaknessDropdownHelp,
    disabled: true,
  };
  return defaultOptions.concat(sessionOptions, helpOption);
});

const handleCurrentScarInput = (event) => {
  const enteredValue = parseInt(event.target.value, 10);
  let scarChanged = false;

  if (isNaN(enteredValue)) {
    if (editableCharacter.linkCurrentToInitialScar) {
      nextTick(() => {
        if (editableCharacter.currentScar !== editableCharacter.initialScar) {
            editableCharacter.currentScar = editableCharacter.initialScar;
            scarChanged = true;
        }
        if (scarChanged) emitCharacterUpdate();
      });
    } // No explicit emit here if not linked, assuming change event on input handles it
    return;
  }

  if (editableCharacter.linkCurrentToInitialScar) {
    if (enteredValue !== editableCharacter.initialScar) {
      editableCharacter.linkCurrentToInitialScar = false; // Unlink
      editableCharacter.currentScar = enteredValue; // Update current scar
      scarChanged = true;
    }
    // No change if enteredValue === initialScar and already linked
  } else {
     if (editableCharacter.currentScar !== enteredValue) {
        editableCharacter.currentScar = enteredValue;
        scarChanged = true;
     }
  }
  if (scarChanged) {
    // This will be caught by the @change on the input field,
    // but if we want to ensure it's emitted after this specific logic:
    // emitCharacterUpdate();
  }
};

watch(() => editableCharacter.initialScar, (newVal) => {
  let changed = false;
  if (editableCharacter.linkCurrentToInitialScar) {
    if (editableCharacter.currentScar !== newVal) {
      editableCharacter.currentScar = newVal;
      changed = true;
    }
  }
  if (changed) emitCharacterUpdate();
});

watch(() => editableCharacter.linkCurrentToInitialScar, (isLinked) => {
  let changed = false;
  if (isLinked) {
    if (editableCharacter.currentScar !== editableCharacter.initialScar) {
      editableCharacter.currentScar = editableCharacter.initialScar;
      changed = true;
    }
  }
  if (changed) emitCharacterUpdate();
});

// Watch for direct changes to weakness text or acquired status to emit update
watch(() => editableCharacter.weaknesses, () => {
    emitCharacterUpdate();
}, { deep: true });

</script>

<style scoped>
/* Styles specific to #scar_weakness_section */
.scar-weakness {
  grid-area: scar-weakness; /* Assigns this component to the 'scar-weakness' grid area */
}

.scar-section, .weakness-section {
  margin-bottom: var(--spacing-large);
}
.scar-section:last-child, .weakness-section:last-child {
  margin-bottom: 0;
}

.sub-box-title {
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-sub-title);
  padding-bottom: var(--spacing-xsmall);
  margin-bottom: var(--spacing-medium);
  border-bottom: 1px solid var(--color-border-separator);
  position: relative;
}
.sub-box-title--scar::before,
.sub-box-title--weakness::before {
 content: '';
 position: absolute;
 left: calc(var(--spacing-medium) * -1 - var(--padding-box) - 1px); /* Align with box edge */
 top: 50%;
 transform: translateY(-50%);
 width: var(--spacing-medium);
 height: 1px;
 background-color: var(--color-border-separator);
}


.link-checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xxsmall); /* Space between this and the input below */
}

.link-checkbox-main-label {
  font-size: var(--font-size-small);
  color: var(--color-text-label);
  margin-right: auto; /* Pushes checkbox and its label to the right */
}

.link-checkbox {
  margin-right: var(--spacing-xxsmall);
  height: var(--font-size-small); /* Approximate alignment */
  width: auto;
}

.link-checkbox-label {
  font-size: var(--font-size-xsmall);
  color: var(--color-text-label);
  user-select: none;
}

.scar-section__current-input.greyed-out {
  background-color: var(--color-background-input-disabled);
  color: var(--color-text-input-disabled);
}

.weakness-list {
  /* Uses base-list-item defined globally */
}

.base-list-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xsmall);
  padding: 0 var(--spacing-xsmall); /* Align with item padding */
  font-size: var(--font-size-small);
  color: var(--color-text-label);
}
.base-list-header-placeholder { /* For number column */
  width: 1.5em; /* Approx width of "X." */
  margin-right: var(--spacing-small);
}


.base-list-item { /* Re-scoped from global, or ensure global is available */
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small);
  gap: var(--spacing-small);
}

.flex-weakness-number {
  width: 1.5em; /* Fixed width for numbering */
  text-align: right;
  color: var(--color-text-label);
  font-size: var(--font-size-small);
  flex-shrink: 0;
}

.flex-weakness-text {
  flex-grow: 3; /* Takes more space */
}
.flex-weakness-text input[type="text"] {
  width: 100%;
}

.flex-weakness-acquired {
  flex-grow: 1;
  min-width: 120px; /* Ensure select is not too small */
}
.flex-weakness-acquired select {
  width: 100%;
}

/* Shared info-row and info-item styles if not globally available from CharacterInfo.vue's import */
/* Assuming .info-row and .info-item are defined in a global CSS or imported base style */
/* If not, they need to be copied here as well, like from CharacterInfo.vue */
.info-row {
  display: flex;
  gap: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xsmall);
}
.info-item--double { flex-basis: calc(50% - var(--spacing-medium) / 2); }

.info-item label {
  font-size: var(--font-size-small);
  color: var(--color-text-label);
  margin-bottom: 0;
}

.info-item input[type="text"],
.info-item input[type="number"],
.info-item select {
  width: 100%;
  padding: var(--input-padding-vertical) var(--input-padding-horizontal);
  border: 1px solid var(--color-border-input);
  border-radius: var(--border-radius-input);
  background-color: var(--color-background-input);
  color: var(--color-text-input);
  font-size: var(--font-size-input);
  box-sizing: border-box;
  height: var(--input-height-base);
}
.info-item input:focus, .info-item select:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}

</style>
