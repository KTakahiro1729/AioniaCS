<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { AioniaGameData } from '@/data/gameData.js';
import { deserializeCharacterPayload } from '@/shared/utils/characterSerialization.js';
import { messages } from '@/locales/ja.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import SessionMemoWindow from '../components/SessionMemoWindow.vue';
import GmTableHeader from '../components/GmTableHeader.vue';
import GmTableLayout from '../components/GmTableLayout.vue';
import { useGmTableStore } from '../stores/useGmTableStore.js';
import { downloadGmSession, readGmSessionFile } from '../services/gmSessionManager.js';

const router = useRouter();
const dataManager = new DataManager(AioniaGameData);
const gmStore = useGmTableStore();
const characterStore = useCharacterStore();
const { showToast } = useNotifications();

const gmMessages = messages.gmTable;

const characterFileInput = ref(null);
const reloadFileInput = ref(null);
const sessionFileInput = ref(null);

const pendingReloadId = ref(null);
const activeMenuId = ref(null);

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function handleDocumentClick(event) {
  if (!event.target.closest('.gm-character-menu') && !event.target.closest('.gm-character-menu-trigger')) {
    activeMenuId.value = null;
  }
}

onMounted(() => {
  document.title = gmMessages.pageTitle;
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function triggerAddCharacter() {
  characterFileInput.value?.click();
}

function triggerSessionLoad() {
  sessionFileInput.value?.click();
}

async function parseCharacterFile(file) {
  try {
    const lower = file.name.toLowerCase();
    let raw;
    if (lower.endsWith('.zip')) {
      const buffer = await file.arrayBuffer();
      raw = await deserializeCharacterPayload(buffer);
    } else {
      const text = await file.text();
      raw = await deserializeCharacterPayload(text);
    }
    return dataManager.parseLoadedData(raw);
  } catch (error) {
    console.error('Failed to parse character file', error);
    throw new Error(gmMessages.errors.characterLoad);
  }
}

async function handleCharacterFileChange(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  if (!file) return;
  try {
    const parsed = await parseCharacterFile(file);
    gmStore.addCharacter({ parsedData: parsed, sourceName: file.name });
    showToast({ type: 'success', title: gmMessages.toasts.added.title, message: gmMessages.toasts.added.message(file.name) });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.loadError.title, message: error.message });
  }
}

async function handleReloadFileChange(event) {
  const file = event.target.files?.[0] || null;
  const columnId = pendingReloadId.value;
  pendingReloadId.value = null;
  event.target.value = '';
  if (!file || !columnId) return;
  try {
    const parsed = await parseCharacterFile(file);
    gmStore.replaceCharacter(columnId, { parsedData: parsed, sourceName: file.name });
    showToast({ type: 'success', title: gmMessages.toasts.reloaded.title, message: gmMessages.toasts.reloaded.message(file.name) });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.loadError.title, message: error.message });
  }
}

async function handleSessionFileChange(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  if (!file) return;
  try {
    const payload = await readGmSessionFile(file);
    gmStore.loadFromSession(payload);
    showToast({ type: 'success', title: gmMessages.toasts.sessionLoaded.title, message: gmMessages.toasts.sessionLoaded.message });
  } catch (error) {
    showToast({ type: 'error', title: gmMessages.toasts.sessionLoadError.title, message: error.message });
  }
}

function openMenu(columnId) {
  activeMenuId.value = activeMenuId.value === columnId ? null : columnId;
}

function editCharacter(column) {
  const data = column.data;
  Object.assign(characterStore.character, clone(data.character));
  characterStore.skills.splice(0, characterStore.skills.length, ...clone(data.skills));
  characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...clone(data.specialSkills));
  Object.assign(characterStore.equipments, clone(data.equipments));
  characterStore.histories.splice(0, characterStore.histories.length, ...clone(data.histories));
  activeMenuId.value = null;
  router.push({ name: 'character-sheet' });
}

function reloadCharacter(column) {
  pendingReloadId.value = column.id;
  reloadFileInput.value?.click();
}

function deleteCharacter(column) {
  const name = column.data?.character?.name || gmMessages.labels.unknownCharacter;
  const confirmed = typeof window === 'undefined' ? true : window.confirm(gmMessages.confirm.delete(name));
  if (confirmed) {
    gmStore.removeCharacter(column.id);
    showToast({ type: 'info', title: gmMessages.toasts.removed.title, message: gmMessages.toasts.removed.message });
  }
  activeMenuId.value = null;
}

function toggleMemoRow() {
  gmStore.toggleRow('memo');
}

function toggleWeaknessRow() {
  gmStore.toggleRow('weaknesses');
}

function toggleSkillDetail() {
  gmStore.setSkillDetailExpanded(!gmStore.skillDetailExpanded);
}

function saveSession() {
  const payload = gmStore.toSessionPayload();
  downloadGmSession(payload, gmMessages.session.defaultFileName);
  showToast({ type: 'success', title: gmMessages.toasts.sessionSaved.title, message: gmMessages.toasts.sessionSaved.message });
}

function updateMemoSize(size) {
  gmStore.updateSessionWindow(size);
}

function updateMemoOrientation(orientation) {
  gmStore.updateSessionWindow({ orientation });
}

function goToSheet() {
  router.push({ name: 'character-sheet' });
}

const workspaceClasses = computed(() => [
  'gm-table-page__workspace',
  `gm-table-page__workspace--${gmStore.sessionWindow.orientation}`,
]);
</script>

<template>
  <div class="gm-table-page">
    <GmTableHeader
      :title="gmMessages.pageTitle"
      :subtitle="gmMessages.pageSubtitle"
      :has-characters="gmStore.hasCharacters"
      :back-label="gmMessages.actions.backToSheet"
      :save-label="gmMessages.actions.saveSession"
      :load-label="gmMessages.actions.loadSession"
      @back="goToSheet"
      @save="saveSession"
      @load="triggerSessionLoad"
    />
    <div :class="workspaceClasses">
      <div class="gm-table-page__main">
        <GmTableLayout
          :columns="gmStore.columns"
          :gm-messages="gmMessages"
          :row-visibility="gmStore.rowVisibility"
          :skill-detail-expanded="gmStore.skillDetailExpanded"
          :active-menu-id="activeMenuId"
          @toggle-memo-row="toggleMemoRow"
          @toggle-weakness-row="toggleWeaknessRow"
          @toggle-skill-detail="toggleSkillDetail"
          @open-menu="openMenu"
          @edit-character="editCharacter"
          @reload-character="reloadCharacter"
          @delete-character="deleteCharacter"
          @set-character-memo="(id, value) => gmStore.setCharacterMemo(id, value)"
          @add-character="triggerAddCharacter"
        />
      </div>
      <SessionMemoWindow
        :memo="gmStore.sessionMemo"
        :width="gmStore.sessionWindow.width"
        :height="gmStore.sessionWindow.height"
        :orientation="gmStore.sessionWindow.orientation"
        :title="gmMessages.session.memoTitle"
        :orientation-labels="gmMessages.session.positionLabels"
        :position-toggle-label="gmMessages.session.positionToggle"
        @update:memo="gmStore.updateSessionMemo"
        @update:size="updateMemoSize"
        @update:orientation="updateMemoOrientation"
      />
    </div>
    <input ref="characterFileInput" type="file" class="gm-file-input" accept=".json,.zip" @change="handleCharacterFileChange" />
    <input ref="reloadFileInput" type="file" class="gm-file-input" accept=".json,.zip" @change="handleReloadFileChange" />
    <input ref="sessionFileInput" type="file" class="gm-file-input" accept=".json" @change="handleSessionFileChange" />
  </div>
</template>

<style scoped src="./GmTablePage.css"></style>

