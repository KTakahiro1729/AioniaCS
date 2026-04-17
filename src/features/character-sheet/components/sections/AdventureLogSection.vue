<template>
  <div id="adventure_log_section" class="adventure-log-section">
    <div class="box-title">{{ sheetMessages.sections.adventureLog.title }}</div>
    <div class="box-content">
      <div class="base-list-header">
        <div class="delete-button-wrapper base-list-header-placeholder"></div>
        <div class="flex-grow">
          <div class="history-item-inputs">
            <div class="flex-history-name">
              <label>{{ sheetMessages.sections.adventureLog.columns.scenario }}</label>
            </div>
            <div class="flex-history-exp">
              <label>{{ sheetMessages.sections.adventureLog.columns.experience }}</label>
            </div>
            <div class="flex-history-scar">
              <label>{{ sheetMessages.sections.adventureLog.columns.scar }}</label>
            </div>
            <div class="flex-history-memo"></div>
          </div>
        </div>
      </div>
      <ul id="histories" class="list-reset">
        <BaseListItem
          v-for="(history, index) in characterStore.adventureLog"
          :key="index"
          :can-delete="!(characterStore.adventureLog.length <= 1 && !hasHistoryContent(history))"
          @delete-item="characterStore.removeHistoryItem(index)"
        >
          <div class="flex-grow">
            <div class="history-item-inputs">
              <div class="flex-history-name">
                <BaseInput
                  type="text"
                  :model-value="history.sessionName"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'sessionName', v)"
                />
              </div>
              <div class="flex-history-exp">
                <BaseInput
                  type="number"
                  min="0"
                  :model-value="history.gotExperiments"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'gotExperiments', v)"
                />
              </div>
              <div class="flex-history-scar">
                <BaseInput
                  type="number"
                  min="0"
                  :model-value="history.increasedScar"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'increasedScar', v)"
                />
              </div>
              <div class="flex-history-memo">
                <BaseInput
                  type="text"
                  :placeholder="sheetMessages.placeholders.adventureMemo"
                  :model-value="history.memo"
                  @update:model-value="(v) => characterStore.updateHistoryItem(index, 'memo', v)"
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
          @click="characterStore.addHistoryItem"
          :aria-label="sheetMessages.aria.addAdventureLog"
        >
          ＋
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseInput from '@/shared/ui/base/BaseInput.vue';
import BaseListItem from '@/shared/ui/base/BaseListItem.vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { messages } from '@/i18n/index.js';

const characterStore = useCharacterStore();
const sheetMessages = messages.sheet;

function hasHistoryContent(h) {
  return !!(
    h.sessionName ||
    (h.gotExperiments !== null && h.gotExperiments !== '') ||
    (h.increasedScar !== null && h.increasedScar !== undefined) ||
    h.memo
  );
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
  flex: 1 1 120px;
  max-width: 150px;
}

.flex-history-exp {
  flex: 0 1 70px;
  max-width: 70px;
}

.flex-history-scar {
  flex: 0 1 70px;
  max-width: 70px;
}

.flex-history-scar {
  flex: 0 1 100px;
}

.flex-history-memo {
  flex: 3 2 150px;
}
</style>
