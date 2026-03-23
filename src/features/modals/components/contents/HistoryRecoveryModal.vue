<template>
  <div class="history-recovery">
    <p class="history-recovery__description">{{ description }}</p>
    <ul v-if="historyEntries.length" class="history-recovery__list">
      <li v-for="item in historyEntries" :key="item.id || item.timestamp" class="history-recovery__item">
        <button type="button" class="history-recovery__entry" @click="confirmRestore(item)">
          <div class="history-recovery__name">{{ item.displayName }}</div>
          <div class="history-recovery__summary">{{ item.summary }}</div>
          <div class="history-recovery__date">{{ item.formattedUpdatedAt }}</div>
        </button>
      </li>
    </ul>
    <p v-else class="history-recovery__empty">{{ emptyLabel }}</p>
    <button type="button" class="button-base history-recovery__cancel" @click="emit('close')">
      {{ cancelLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  historyList: {
    type: Array,
    default: () => [],
  },
  description: {
    type: String,
    default: '未保存のキャラクターを復元します。',
  },
  emptyLabel: {
    type: String,
    default: '保存された履歴はありません。',
  },
  cancelLabel: {
    type: String,
    default: 'キャンセル',
  },
  confirmMessage: {
    type: String,
    default: '現在の編集内容は破棄されます。よろしいですか？',
  },
});

const emit = defineEmits(['restore', 'close']);

const historyEntries = computed(() =>
  props.historyList.map((item) => {
    const updatedAt = item.meta?.updatedAt ? new Date(item.meta.updatedAt) : null;
    const formattedUpdatedAt = updatedAt
      ? updatedAt.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';
    const summaryParts = [item.meta?.species, item.meta?.occupation].filter(Boolean);
    return {
      ...item,
      displayName: item.meta?.name || '名称未設定',
      summary: summaryParts.length ? summaryParts.join(' / ') : '---',
      formattedUpdatedAt,
    };
  }),
);

function confirmRestore(item) {
  if (typeof window === 'undefined' || window.confirm(props.confirmMessage)) {
    emit('restore', item);
  }
}
</script>

<style scoped>
.history-recovery {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-recovery__description {
  margin: 0;
  color: var(--color-text-muted);
}

.history-recovery__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-recovery__item {
  margin: 0;
}

.history-recovery__entry {
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--color-border-normal);
  background: var(--color-panel-body);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-primary, #fff);
}

.history-recovery__entry:hover {
  border-color: var(--color-border-hover);
}

.history-recovery__name {
  font-size: 1rem;
  font-weight: 700;
}

.history-recovery__summary,
.history-recovery__date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.history-recovery__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.history-recovery__cancel {
  align-self: flex-end;
  padding-inline: 16px;
}
</style>
