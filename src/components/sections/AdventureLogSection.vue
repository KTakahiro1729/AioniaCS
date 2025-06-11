<script setup>
import BaseInput from '../common/BaseInput.vue';
const props = defineProps({
  histories: Array,
});
const emit = defineEmits(['addHistory','removeHistory']);
const hasHistoryContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo);
</script>
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
        <li v-for="(history, index) in histories" :key="index" class="base-list-item">
          <div class="delete-button-wrapper">
            <button
              type="button"
              class="button-base list-button list-button--delete"
              @click="emit('removeHistory', index)"
              :disabled="histories.length <= 1 && !hasHistoryContent(history)"
              aria-label="冒険記録を削除"
            >－</button>
          </div>
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <BaseInput type="text" v-model="history.sessionName" />
              </div>
              <div class="flex-history-exp">
                <BaseInput type="number" v-model.number="history.gotExperiments" min="0" />
              </div>
              <div class="flex-history-memo">
                <BaseInput type="text" v-model="history.memo" />
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div class="add-button-container-left">
        <button
          type="button"
          class="button-base list-button list-button--add"
          @click="emit('addHistory')"
          aria-label="冒険記録を追加"
        >＋</button>
      </div>
    </div>
  </div>
</template>
