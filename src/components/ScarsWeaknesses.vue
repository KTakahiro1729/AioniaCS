<template>
  <div class="scar-weakness">
    <div class="box-title">傷痕と弱点</div>
    <div class="box-content">
      <div class="scar-section">
        <div class="sub-box-title sub-box-title--scar">傷痕</div>
        <div class="info-row">
          <div class="info-item info-item--double">
            <div class="link-checkbox-container">
              <label for="current_scar_sw" class="link-checkbox-main-label">現在値</label>
              <input
                type="checkbox"
                id="link_current_to_initial_scar_checkbox_sw"
                v-model="editableCharacter.linkCurrentToInitialScar"
                class="link-checkbox"
                @change="emitCharacterUpdate"
              />
              <label for="link_current_to_initial_scar_checkbox_sw" class="link-checkbox-label">連動</label>
            </div>
            <input
              type="number"
              id="current_scar_sw_input"
              v-model.number="editableCharacter.currentScar"
              @input="handleCurrentScarInput"
              @change="emitCharacterUpdate"
              :class="{'greyed-out': editableCharacter.linkCurrentToInitialScar}"
              min="0"
              class="scar-section__current-input"
            />
          </div>
          <div class="info-item info-item--double">
            <label for="initial_scar_sw">初期値</label>
            <input
              type="number"
              id="initial_scar_sw"
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
          <li class="base-list-header weakness-labels-header">
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
import { reactive, computed, watch, defineProps, defineEmits, nextTick } from 'vue';

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  histories: {
    type: Array,
    required: true,
  },
  AioniaGameData: {
    type: Object,
    required: true,
  }
});

const emit = defineEmits(['update:character']);

const editableCharacter = reactive(JSON.parse(JSON.stringify(props.character)));

watch(() => props.character, (newCharacterData) => {
  Object.assign(editableCharacter, JSON.parse(JSON.stringify(newCharacterData)));
}, { deep: true });


const emitCharacterUpdate = () => {
  emit('update:character', JSON.parse(JSON.stringify(editableCharacter)));
};


const sessionNamesForWeaknessDropdown = computed(() => {
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
    }
    return;
  }

  if (editableCharacter.linkCurrentToInitialScar) {
    if (enteredValue !== editableCharacter.initialScar) {
      editableCharacter.linkCurrentToInitialScar = false;
      editableCharacter.currentScar = enteredValue;
      scarChanged = true;
    }
  } else {
     if (editableCharacter.currentScar !== enteredValue) {
        editableCharacter.currentScar = enteredValue;
        scarChanged = true;
     }
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

watch(() => editableCharacter.weaknesses, () => {
    emitCharacterUpdate();
}, { deep: true });

</script>

<style scoped>
/* .scar-weakness is styled by _layout.css (grid-area) */
/* .box-title, .box-content are styled by _components.css */
/* .info-row, .info-item, .info-item--double are from _layout.css */
/* General input, select, label styles are from _components.css */
/* .list-reset is from _base.css */
/* .base-list-item, .base-list-header are from _components.css */
/* .greyed-out class is from _components.css */


/* Styles moved from _sections.css */
.scar-section {
  margin-bottom: 25px;
}

.link-checkbox-container {
  display: flex;
  align-items: center;
}

.link-checkbox-main-label {
  margin-right: 8px;
  /* Global label style will apply for font-weight, size, color */
}

.link-checkbox {
  margin-right: 4px;
  margin-bottom: 2px; /* from _sections.css */
  /* Global input[type=checkbox] style will apply for transform, accent-color, cursor */
  /* width: auto; is default for checkbox and in global */
}

.link-checkbox-label {
  font-size: 0.9em;
  color: var(--color-text-muted);
  font-weight: normal;
  user-select: none;
  margin-bottom: 0;
}

.sub-box-title--scar { /* This is applied on top of global .sub-box-title */
  margin-top: -18px;
  margin-bottom: 15px;
}

.sub-box-title--weakness { /* This is applied on top of global .sub-box-title */
  margin-top: 0;
  margin-bottom: 10px;
  border-top: 1px solid var(--color-border-normal);
}

/* .weakness-list class is mainly for semantic targeting, no specific styles in _sections.css */
/* It uses .base-list-item which is globally styled */
.weakness-list .base-list-item { /* Specific adjustments from _sections.css */
  font-size: 0.9em;
  align-items: center; /* Overrides flex-start from global .base-list-item if different */
}

.weakness-labels-header { /* This class is added to a .base-list-header */
  color: var(--color-text-muted); /* from _sections.css */
  /* Child label elements will inherit this color or use global label color */
}

.weakness-labels-header .flex-weakness-number { /* from _sections.css */
  color: transparent;
  user-select: none;
}
/* End of .weakness-labels-header specific styles */


.flex-weakness-number {
  font-family: "Noto Serif JP", serif; /* from _sections.css */
  color: var(--color-accent); /* from _sections.css */
  font-weight: 700; /* from _sections.css */
  width: 20px; /* from _sections.css */
  text-align: center; /* from _sections.css */
  /* font-size from .weakness-list .base-list-item (0.9em) or global if not overridden */
}

.flex-weakness-text {
  flex: 1; /* from _sections.css */
}

.flex-weakness-acquired {
  width: 150px; /* from _sections.css */
}

.flex-weakness-acquired select {
  /* width: 100%; is global for select */
}
.flex-weakness-acquired option[disabled] { /* from _sections.css */
  color: var(--color-text-muted);
  font-style: italic;
}
/* End of styles moved from _sections.css */

/* .scar-section__current-input is used in template but might not need specific styles beyond global .greyed-out */

</style>
