<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGmTableStore } from '@/features/gm-table/stores/gmTableStore.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useGmCharacterImport } from '@/features/gm-table/composables/useGmCharacterImport.js';
import { createGmTableBlob, parseGmTableFile } from '@/features/gm-table/services/gmTableDataManager.js';
import GmTableView from '@/features/gm-table/components/GmTableView.vue';
import SessionMemoWindow from '@/features/gm-table/components/SessionMemoWindow.vue';
import NotificationContainer from '@/features/notifications/components/NotificationContainer.vue';
import BaseModal from '@/features/modals/components/BaseModal.vue';

const router = useRouter();
const store = useGmTableStore();
const characterStore = useCharacterStore();
const { handleFiles, reloadCharacter } = useGmCharacterImport();

const characters = computed(() => store.characters);
const rowState = computed(() => store.rowState);
const baseSkills = computed(() => store.baseSkills);
const specialSkillDictionary = computed(() => store.specialSkillDictionary);
const sessionMemo = computed(() => store.sessionMemo);

const loadInput = ref(null);
const exporting = ref(false);
const importingSnapshot = ref(false);

function applyCharacterToSheet(parsedData) {
  Object.assign(characterStore.character, parsedData.character);
  characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
  characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
  Object.assign(characterStore.equipments, parsedData.equipments);
  characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
}

function handleEditCharacter(character) {
  if (!character?.data) return;
  applyCharacterToSheet(character.data);
  router.push({ name: 'character-sheet' });
}

function handleReloadCharacter(character) {
  reloadCharacter(character);
}

function handleRemoveCharacter(character) {
  if (!character) return;
  const ok = window.confirm('このキャラクターを削除しますか？');
  if (ok) {
    store.removeCharacter(character.id);
  }
}

function handleMemoUpdate(payload) {
  store.updateCharacterMemo(payload.id, payload.value);
}

function triggerSnapshotLoad() {
  loadInput.value?.click();
}

async function handleSnapshotChange(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    importingSnapshot.value = true;
    const snapshot = await parseGmTableFile(file);
    store.replaceState(snapshot);
  } catch (error) {
    console.error('Failed to load GM table file', error);
    window.alert(error?.message || 'GMテーブルの読込に失敗しました。');
  } finally {
    importingSnapshot.value = false;
  }
}

function handleSaveSnapshot() {
  try {
    exporting.value = true;
    const snapshot = store.exportSnapshot();
    createGmTableBlob(snapshot);
  } finally {
    exporting.value = false;
  }
}

watch(
  () => characters.value.length,
  (count) => {
    if (count === 0) {
      document.title = 'GM管理テーブル | Aionia';
    } else {
      document.title = `GM管理 (${count}名)`;
    }
  },
  { immediate: true },
);

onMounted(() => {
  document.body.classList.remove('is-modal-open');
});
</script>

<template>
  <div class="gm-page">
    <header class="gm-page__header">
      <div class="gm-page__header-left">
        <h1 class="gm-page__title">GMコントロール</h1>
        <p class="gm-page__subtitle">セッションを統括し、冒険者たちの状態を俯瞰しましょう。</p>
      </div>
      <nav class="gm-page__nav">
        <RouterLink class="gm-page__link" :to="{ name: 'character-sheet' }">キャラクターシート</RouterLink>
        <button
          type="button"
          class="gm-page__link gm-page__link--ghost"
          @click="triggerSnapshotLoad"
          :disabled="importingSnapshot"
        >
          読込
        </button>
        <button type="button" class="gm-page__link" @click="handleSaveSnapshot" :disabled="exporting || characters.length === 0">
          保存
        </button>
        <input
          ref="loadInput"
          class="gm-page__file-input"
          type="file"
          accept=".json"
          @change="handleSnapshotChange"
        />
      </nav>
    </header>

    <main class="gm-page__content">
      <GmTableView
        :characters="characters"
        :row-state="rowState"
        :base-skills="baseSkills"
        :special-skill-dictionary="specialSkillDictionary"
        @import-files="handleFiles"
        @toggle-memo="store.toggleMemoVisibility"
        @toggle-weaknesses="store.toggleWeaknessExpansion"
        @toggle-skills-detail="store.toggleSkillsDetail"
        @update-character-memo="handleMemoUpdate"
        @edit-character="handleEditCharacter"
        @reload-character="handleReloadCharacter"
        @remove-character="handleRemoveCharacter"
      />
    </main>

    <SessionMemoWindow
      :model-value="sessionMemo.text"
      :minimized="sessionMemo.minimized"
      :position="sessionMemo.position"
      :size="sessionMemo.size"
      @update:model-value="store.setSessionMemoText"
      @update:minimized="store.setSessionMemoMinimized"
      @update:position="store.setSessionMemoPosition"
      @update:size="store.setSessionMemoSize"
    />

    <BaseModal />
    <NotificationContainer />
  </div>
</template>

<style scoped>
.gm-page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, rgba(82, 59, 118, 0.45), rgba(10, 9, 15, 0.95));
  color: #f5f1ff;
  padding-bottom: 4rem;
}

.gm-page__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 2.5rem 1rem;
}

.gm-page__title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
}

.gm-page__subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(226, 216, 255, 0.75);
}

.gm-page__nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.gm-page__link {
  background: rgba(38, 34, 52, 0.8);
  border: 1px solid rgba(199, 181, 255, 0.4);
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  color: inherit;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.gm-page__link:hover {
  background: rgba(90, 71, 131, 0.85);
  transform: translateY(-1px);
}

.gm-page__link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.gm-page__link--ghost {
  background: transparent;
}

.gm-page__content {
  padding: 0 2.5rem 3rem;
}

.gm-page__file-input {
  display: none;
}

@media (max-width: 768px) {
  .gm-page__header {
    padding: 1.5rem 1.5rem 0.75rem;
  }

  .gm-page__content {
    padding: 0 1.5rem 3rem;
  }

  .gm-page__nav {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
