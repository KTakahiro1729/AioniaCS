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
            <button type="button" class="button-base list-button list-button--delete" @click="emit('remove', index)" :disabled="histories.length <= 1 && !hasContent(history)">－</button>
          </div>
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <input type="text" v-model="history.sessionName" />
              </div>
              <div class="flex-history-exp">
                <input type="number" v-model.number="history.gotExperiments" min="0" />
              </div>
              <div class="flex-history-memo">
                <input type="text" v-model="history.memo" />
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div class="add-button-container-left">
        <button type="button" class="button-base list-button list-button--add" @click="emit('add')">＋</button>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ histories: Array });
const emit = defineEmits(['add', 'remove']);
const hasContent = (h) => !!(h.sessionName || (h.gotExperiments !== null && h.gotExperiments !== '') || h.memo);
</script>
