<template>
  <div class="adventure-log-section">
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
  manageListItemUtil: {
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
  });
  emitHistoriesUpdate();
};

const removeHistoryItem = (index) => {
  props.manageListItemUtil({
    list: localHistories,
    action: "remove",
    index,
    newItemFactory: () => ({ sessionName: "", gotExperiments: null, memo: "" }),
    hasContentChecker: hasHistoryContent,
  });
  emitHistoriesUpdate();
};

watch(localHistories, () => {
  emitHistoriesUpdate();
}, { deep: true });

</script>

<style scoped>
/* .adventure-log-section is styled by _layout.css (grid-area) */
/* .box-title, .box-content are styled by _components.css */
/* .base-list-header, .base-list-item, .delete-button-wrapper, list buttons, .add-button-container-left are from _components.css */
/* General input styles are from _components.css */
/* .flex-grow is from _layout.css */
/* .list-reset is from _base.css */

/* Styles moved from _sections.css for Adventure Log */
.history-item-inputs {
  display: flex;
  flex-wrap: wrap; /* from _sections.css, was 'wrap' */
  align-items: end; /* from _sections.css */
  gap: 5px; /* from _sections.css, was var(--spacing-small) */
}

.flex-history-name {
  flex: 1 1 150px; /* from _sections.css */
  max-width: 150px; /* from _sections.css */
}

.flex-history-exp {
  flex: 0 1 80px; /* from _sections.css */
}

.flex-history-memo {
  flex: 3 2 220px; /* from _sections.css */
}
/* End of styles moved from _sections.css */

</style>
