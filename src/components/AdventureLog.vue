<template>
  <div id="adventure_log_section" class="adventure-log-section">
    <div class="box-title">冒険の記録</div>
    <div class="box-content">
      <div class="base-list-header">
        <div class="delete-button-wrapper base-list-header-placeholder"></div>
        <div class="flex-grow">
          <div class="history-item-inputs">
            <div class="flex-history-name"><label>シナリオ名</label></div>
            <div class="flex-history-exp"><label>経験点</label></div>
            <div class="flex-history-memo"><label>メモ</label></div>
          </div>
        </div>
      </div>
      <ul id="histories" class="list-reset">
        <li v-for="(history, index) in localHistories" :key="index" class="base-list-item">
          <div class="delete-button-wrapper">
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="removeHistoryItem(index)"
              :disabled="localHistories.length <= 1 && !hasHistoryContent(history)"
              aria-label="冒険記録を削除"
            >－</button>
          </div>
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <input type="text" v-model="history.sessionName" @change="emitHistoriesUpdate" />
              </div>
              <div class="flex-history-exp">
                <input type="number" v-model.number="history.gotExperiments" min="0" @change="emitHistoriesUpdate" />
              </div>
              <div class="flex-history-memo">
                <input type="text" v-model="history.memo" @change="emitHistoriesUpdate" />
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div class="add-button-container-left">
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="addHistoryItem()"
          aria-label="冒険記録を追加"
        >＋</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch } from 'vue';

const props = defineProps({
  histories: {
    type: Array,
    required: true,
  },
  manageListItemUtil: { // For _manageListItem from App.vue
    type: Function,
    required: true,
  }
});

const emit = defineEmits(['update:histories', 'histories-changed']);

const localHistories = reactive(JSON.parse(JSON.stringify(props.histories)));

watch(() => props.histories, (newVal) => {
  localHistories.length = 0;
  newVal.forEach(item => localHistories.push(JSON.parse(JSON.stringify(item))));
}, { deep: true });

const emitHistoriesUpdate = () => {
  emit('update:histories', JSON.parse(JSON.stringify(localHistories)));
  emit('histories-changed');
};

const hasHistoryContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== "") || h.memo);

const addHistoryItem = () => {
  props.manageListItemUtil({
    list: localHistories,
    action: "add",
    newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
    // No maxLength for histories in the original setup
  });
  emitHistoriesUpdate();
};

const removeHistoryItem = (index) => {
  props.manageListItemUtil({
    list: localHistories,
    action: "remove",
    index,
    newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
    hasContentChecker: hasHistoryContent, // local method
  });
  emitHistoriesUpdate();
};

// Watch for deep changes in localHistories to emit updates.
// Individual @change on inputs also call emitHistoriesUpdate for more immediate feedback.
watch(localHistories, () => {
  // This watcher acts as a fallback or for programmatic changes to localHistories.
  // Manual changes via inputs should ideally trigger emit through their own @change handlers.
  emitHistoriesUpdate();
}, { deep: true });

</script>

<style scoped>
/* Styles specific to #adventure_log_section */
.adventure-log-section {
  grid-area: adventure-log; /* Assigns this component to the 'adventure-log' grid area */
}

/* .box-title and .box-content are assumed to be global or styled by parent grid item */

/* Base list header styles (if not global) */
.base-list-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-xsmall);
  padding: 0 var(--spacing-xsmall);
  font-size: var(--font-size-small);
  color: var(--color-text-label);
}
.base-list-header-placeholder {
  width: var(--button-min-width-small, 28px); /* Approx width of delete button */
  margin-right: var(--spacing-small); /* Matches gap in base-list-item */
  flex-shrink: 0;
}

/* Base list item styles (if not global) */
.base-list-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-small);
  gap: var(--spacing-small);
}
.base-list-item:last-child {
    margin-bottom: 0;
}


.delete-button-wrapper {
  flex-shrink: 0;
}

.list-button { /* Assuming this is a global style or defined in a base sheet */
  padding: var(--button-padding-small);
  font-size: var(--font-size-small);
  line-height: 1;
  min-width: var(--button-min-width-small);
  height: var(--button-min-width-small);
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.list-button--delete {
  background-color: var(--color-button-danger-bg);
}
.list-button--delete:hover {
  background-color: var(--color-button-danger-hover-bg);
}
.list-button--delete:disabled {
  background-color: var(--color-button-disabled-bg);
  border-color: var(--color-button-disabled-border);
  color: var(--color-button-disabled-text);
}
.list-button--add {
   background-color: var(--color-button-primary-bg);
}
.list-button--add:hover {
   background-color: var(--color-button-primary-hover-bg);
}
/* End copied button styles */

.flex-grow { /* Define if not global */
    flex-grow: 1;
}

.history-item-inputs {
  display: flex;
  gap: var(--spacing-small);
  width: 100%;
}

.flex-history-name {
  flex: 2; /* More space for session name */
}
.flex-history-exp {
  flex: 1;
  min-width: 60px; /* Ensure number input is not too small */
}
.flex-history-memo {
  flex: 3; /* More space for memo */
}

.history-item-inputs input[type="text"],
.history-item-inputs input[type="number"] {
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

.history-item-inputs input:focus {
  border-color: var(--color-border-input-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-outline-focus);
}

.add-button-container-left {
  margin-top: var(--spacing-small);
}
</style>
