<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">{{ sheetMessages.sections.memo.title }}</div>
    <div class="box-content memo-layout-container">
      <textarea
        id="character_text"
        class="character-memo-textarea"
        :placeholder="sheetMessages.placeholders.characterMemo"
        v-model.lazy="localValue"
      ></textarea>
      <div class="submemo-list" v-if="subMemos.length">
        <SubMemoItem
          v-for="subMemo in subMemos"
          :key="subMemo.id"
          :sub-memo="subMemo"
          :messages="subMemoMessages"
          :collapsed="isCollapsed(subMemo.id)"
          @toggle-collapse="() => toggleCollapse(subMemo.id)"
          @update-title="(value) => handleUpdateTitle(subMemo.id, value)"
          @update-content="(value) => handleUpdateContent(subMemo.id, value)"
          @update-spoiler="(value) => handleUpdateSpoiler(subMemo.id, value)"
          @request-remove="() => confirmRemoval(subMemo.id)"
        />
      </div>
      <div class="add-button-row">
        <button
          class="button-base list-button list-button--add"
          type="button"
          :aria-label="subMemoMessages.addButton"
          @click="handleAddSubMemo"
        >
          ＋
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { messages } from '@/i18n/index.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import SubMemoItem from './SubMemoItem.vue';

const characterStore = useCharacterStore();
const { showModal } = useModal();
const sheetMessages = messages.sheet;
const subMemoMessages = sheetMessages.sections.memo.subMemo;
const LOCAL_STORAGE_KEY = 'aioniacs_ui_submemos_state';
const localValue = computed({
  get: () => characterStore.character.memo,
  set: (val) => {
    characterStore.character.memo = val;
  },
});
const subMemos = computed(() => characterStore.character.subMemos || []);
const expandedIds = ref(new Set());

function loadUiState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(parsed?.expandedIds || []);
  } catch {
    return new Set();
  }
}

function persistUiState() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ expandedIds: [...expandedIds.value] }));
  } catch {
    // do nothing when storage is unavailable
  }
}

function syncUiStateWithSubMemos(list) {
  const ids = new Set(list.map((memo) => memo.id));
  const nextExpanded = new Set([...expandedIds.value].filter((id) => ids.has(id)));
  const expandedChanged = nextExpanded.size !== expandedIds.value.size;

  if (expandedChanged) {
    expandedIds.value = nextExpanded;
    persistUiState();
  }
}

expandedIds.value = loadUiState();
syncUiStateWithSubMemos(subMemos.value);

watch(
  () => subMemos.value.map((memo) => memo.id),
  () => {
    syncUiStateWithSubMemos(subMemos.value);
  },
  { immediate: true },
);

function isCollapsed(id) {
  return !expandedIds.value.has(id);
}

function toggleCollapse(id) {
  const next = new Set(expandedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedIds.value = next;
  persistUiState();
}

function handleAddSubMemo() {
  characterStore.addSubMemo();
}

function handleUpdateTitle(id, value) {
  characterStore.updateSubMemo(id, { title: value });
}

function handleUpdateContent(id, value) {
  characterStore.updateSubMemo(id, { content: value });
}

function handleUpdateSpoiler(id, value) {
  characterStore.updateSubMemo(id, { isSpoiler: value });
}

async function confirmRemoval(id) {
  const result = await showModal({
    title: subMemoMessages.deleteConfirm.title,
    message: subMemoMessages.deleteConfirm.message,
    buttons: [
      { label: subMemoMessages.deleteConfirm.delete, value: 'delete', variant: 'primary' },
      { label: subMemoMessages.deleteConfirm.cancel, value: 'cancel', variant: 'secondary' },
    ],
  });
  if (result?.value === 'delete') {
    characterStore.removeSubMemo(id);
  }
}
</script>

<style scoped>
.character-memo .box-content {
  max-width: 100%;
}

.character-memo-textarea {
  width: 100%;
  min-height: 180px;
  resize: vertical;
}

.memo-layout-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.submemo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-button-row {
  display: flex;
}
</style>
