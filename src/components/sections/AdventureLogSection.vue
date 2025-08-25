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
        <BaseListItem
          v-for="(history, index) in characterStore.histories"
          :key="index"
          :show-delete-button="!uiStore.isViewingShared"
          :can-delete="!(characterStore.histories.length <= 1 && !hasHistoryContent(history))"
          @delete-item="characterStore.removeHistoryItem(index)"
        >
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <BaseInput
                  type="text"
                  :model-value="history.sessionName"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'sessionName', v)"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <div class="flex-history-exp">
                <BaseInput
                  type="number"
                  min="0"
                  :model-value="history.gotExperiments"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'gotExperiments', v)"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
              <div class="flex-history-memo">
                <BaseInput
                  type="text"
                  :model-value="history.memo"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'memo', v)"
                  :disabled="uiStore.isViewingShared"
                />
              </div>
            </div>
          </div>
        </BaseListItem>
      </ul>
      <div class="add-button-container-left" v-if="!uiStore.isViewingShared">
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="characterStore.addHistoryItem"
          aria-label="冒険記録を追加"
        >
          ＋
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseInput from '../common/BaseInput.vue';
import BaseListItem from '../common/BaseListItem.vue';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useUiStore } from '../../stores/uiStore.js';

const characterStore = useCharacterStore();
const uiStore = useUiStore();

function hasHistoryContent(h) {
  return !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo);
}
</script>

<style scoped>
.history-item-inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 5px;
}

.flex-history-name {
  flex: 1 1 150px;
  max-width: 150px;
}

.flex-history-exp {
  flex: 0 1 80px;
}

.flex-history-memo {
  flex: 3 2 220px;
}
</style>
