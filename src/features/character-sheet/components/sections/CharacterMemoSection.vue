<template>
  <div id="character_memo" class="character-memo">
    <div class="box-title">{{ sheetMessages.sections.memo.title }}</div>
    <div class="box-content">
      <textarea
        id="character_text"
        class="character-memo-textarea"
        :placeholder="sheetMessages.placeholders.characterMemo"
        v-model.lazy="localValue"
        :readonly="uiStore.isViewingShared"
      ></textarea>
    </div>
    <div class="submemo-list" v-if="subMemos.length">
      <SubMemoItem
        v-for="subMemo in subMemos"
        :key="subMemo.id"
        :sub-memo="subMemo"
        :messages="subMemoMessages"
        :collapsed="isCollapsed(subMemo.id)"
        :revealed="isRevealed(subMemo)"
        :readonly="uiStore.isViewingShared"
        @toggle-collapse="() => toggleCollapse(subMemo.id)"
        @update-title="(value) => handleUpdateTitle(subMemo.id, value)"
        @update-content="(value) => handleUpdateContent(subMemo.id, value)"
        @update-spoiler="(value) => handleUpdateSpoiler(subMemo.id, value)"
        @reveal="() => revealSubMemo(subMemo.id)"
        @request-remove="() => confirmRemoval(subMemo.id)"
      />
    </div>
    <div class="submemo-actions">
      <button class="button-base" type="button" :disabled="uiStore.isViewingShared" @click="handleAddSubMemo">
        {{ subMemoMessages.addButton }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { messages } from '@/i18n/index.js';
import { useModal } from '@/features/modals/composables/useModal.js';
import SubMemoItem from './SubMemoItem.vue';

const characterStore = useCharacterStore();
const uiStore = useUiStore();
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
const revealedIds = ref(new Set());

function loadUiState() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { expanded: new Set(), revealed: new Set() };
    const parsed = JSON.parse(raw);
    return {
      expanded: new Set(parsed?.expandedIds || []),
      revealed: new Set(parsed?.revealedIds || []),
    };
  } catch (e) {
    return { expanded: new Set(), revealed: new Set() };
  }
}

function persistUiState() {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ expandedIds: [...expandedIds.value], revealedIds: [...revealedIds.value] }),
    );
  } catch (e) {
    // do nothing when storage is unavailable
  }
}

function syncUiStateWithSubMemos(list) {
  const ids = new Set(list.map((memo) => memo.id));
  const nextExpanded = new Set([...expandedIds.value].filter((id) => ids.has(id)));
  const nextRevealed = new Set([...revealedIds.value].filter((id) => ids.has(id)));

  list.forEach((memo) => {
    if (!memo.isSpoiler && nextRevealed.has(memo.id)) {
      nextRevealed.delete(memo.id);
    }
  });

  const expandedChanged =
    nextExpanded.size !== expandedIds.value.size || [...nextExpanded].some((id) => !expandedIds.value.has(id));
  const revealedChanged =
    nextRevealed.size !== revealedIds.value.size || [...nextRevealed].some((id) => !revealedIds.value.has(id));

  if (expandedChanged) {
    expandedIds.value = nextExpanded;
  }
  if (revealedChanged) {
    revealedIds.value = nextRevealed;
  }
  if (expandedChanged || revealedChanged) {
    persistUiState();
  }
}

const storedUiState = loadUiState();
expandedIds.value = storedUiState.expanded;
revealedIds.value = storedUiState.revealed;
syncUiStateWithSubMemos(subMemos.value);

watch(
  () => subMemos.value.map((memo) => `${memo.id}:${memo.isSpoiler}`),
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

function isRevealed(subMemo) {
  return revealedIds.value.has(subMemo.id) || !subMemo.isSpoiler;
}

function revealSubMemo(id) {
  if (revealedIds.value.has(id)) return;
  const next = new Set(revealedIds.value);
  next.add(id);
  revealedIds.value = next;
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

.submemo-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.submemo-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.button-base:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
