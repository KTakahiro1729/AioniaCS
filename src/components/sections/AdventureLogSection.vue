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
          v-for="(history, index) in histories"
          :key="index"
          :show-delete-button="true"
          :can-delete="!(histories.length <= 1 && !hasHistoryContent(history))"
          @delete-item="removeItem(index)"
        >
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <BaseInput
                  type="text"
                  :model-value="history.sessionName"
                  @update:model-value="v => updateField(index, 'sessionName', v)"
                />
              </div>
              <div class="flex-history-exp">
                <BaseInput
                  type="number"
                  min="0"
                  :model-value="history.gotExperiments"
                  @update:model-value="v => updateField(index, 'gotExperiments', v)"
                />
              </div>
              <div class="flex-history-memo">
                <BaseInput
                  type="text"
                  :model-value="history.memo"
                  @update:model-value="v => updateField(index, 'memo', v)"
                />
              </div>
            </div>
          </div>
        </BaseListItem>
      </ul>
      <div class="add-button-container-left">
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="addItem"
          aria-label="冒険記録を追加"
        >＋</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseInput from '../common/BaseInput.vue';
import BaseListItem from '../common/BaseListItem.vue';

const props = defineProps({
  histories: { type: Array, default: () => [] },
});

const emit = defineEmits(['add-item', 'remove-item', 'update:history']);

function addItem() {
  emit('add-item');
}

function removeItem(index) {
  emit('remove-item', index);
}

function updateField(index, field, value) {
  emit('update:history', index, field, value);
}

function hasHistoryContent(h) {
  return !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo);
}
</script>

