<template>
  <div class="adventure-log-section"> <!-- id removed, class used for grid -->
    <div class="box-title">冒険の記録</div>
    <div class="box-content">
      <div class="base-list-header"> <!-- Styled by _components.css -->
        <div class="delete-button-wrapper base-list-header-placeholder"></div> <!-- delete-button-wrapper from _components.css -->
        <div class="flex-grow"> <!-- flex-grow from _layout.css -->
          <div class="history-item-inputs"> <!-- Styled by _sections.css -->
            <div class="flex-history-name"><label>シナリオ名</label></div>
            <div class="flex-history-exp"><label>経験点</label></div>
            <div class="flex-history-memo"><label>メモ</label></div>
          </div>
        </div>
      </div>
      <ul id="histories" class="list-reset"> <!-- list-reset from _base.css -->
        <li v-for="(history, index) in localHistories" :key="index" class="base-list-item"> <!-- Styled by _components.css -->
          <div class="delete-button-wrapper"> <!-- Styled by _components.css -->
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="removeHistoryItem(index)"
              :disabled="localHistories.length <= 1 && !hasHistoryContent(history)"
              aria-label="冒険記録を削除"
            >－</button>
          </div>
          <div class="flex-grow"> <!-- Styled by _layout.css -->
            <div class="history-item-inputs"> <!-- Styled by _sections.css -->
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
      <div class="add-button-container-left"> <!-- Styled by _components.css -->
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
/* .history-item-inputs and its children (.flex-history-*) are from _sections.css */
/* General input styles are from _components.css */
/* .flex-grow is from _layout.css */
/* .list-reset is from _base.css */

/*
  The scoped style for .base-list-header-placeholder in AdventureLog.vue was:
    width: var(--button-min-width-small, 28px);
    margin-right: var(--spacing-small);
    flex-shrink: 0;
  Global _components.css has:
    .base-list-header .base-list-header-placeholder { height: 0; }
    .delete-button-wrapper { width: 30px; height: 30px; ... flex-shrink: 0; }
  The global .delete-button-wrapper already provides a fixed width (30px) and flex-shrink.
  If .base-list-header-placeholder in the header is intended to align with these buttons,
  its width should match. The global `height:0` for placeholder in header seems okay if there's no visible content.
  The key is the `div.delete-button-wrapper` inside the header row needs to take up space.
  The `base-list-header-placeholder` class is applied to the `delete-button-wrapper` in the template's header.
  So, the global `.delete-button-wrapper` style (width: 30px) should apply, making the scoped style for width redundant.
  The margin-right might still be needed if the gap from .base-list-header isn't enough.
  However, .base-list-header has `gap: 5px` which should apply between placeholder and flex-grow.
  Thus, all specific scoped styles for .base-list-header-placeholder can likely be removed.
*/
</style>
