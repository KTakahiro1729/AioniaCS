<template>
  <div class="character-hub">
        <template v-if="uiStore.isSignedIn">
          <ul class="character-hub--list">
            <li
              v-for="ch in characters"
              :key="ch.id"
              :class="['character-hub--item', { 'character-hub--item--highlighted': ch.id === uiStore.currentDriveFileId }]"
            >
              
            <button class="character-hub--name" @click="confirmLoad(ch)">
                {{ ch.isCorrupted ? `🚫 ${ch.characterName || ch.name}` : ch.characterName || ch.name }}
              </button>
              
              <span class="character-hub--date">{{ formatDate(ch.updatedAt) }}</span>
              <div class="character-hub--actions-inline">
                <button class="button-base button-compact" @click="overwrite(ch)">上書き保存</button>
                <button class="button-base button-compact" @click="exportLocal(ch)">端末保存</button>
                <button class="button-base button-compact" @click="deleteChar(ch)">削除</button>
              </div>
            </li>
          </ul>
        </template>
        <template v-else>
          <p class="character-hub--description">
            Google Driveと連携して、キャラクターを保存・共有できます。
          </p>
          
        </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useCharacterStore } from '../../stores/characterStore.js';
import { useNotifications } from '../../composables/useNotifications.js';
import { useModal } from '../../composables/useModal.js';
import { messages } from '../../locales/ja.js';

const props = defineProps({
  dataManager: Object,
  loadCharacter: Function,
  saveToDrive: Function,
});

const emit = defineEmits(['sign-in', 'sign-out']);

const uiStore = useUiStore();
const characterStore = useCharacterStore();
const { showToast, showAsyncToast } = useNotifications();
const { showModal } = useModal();
const characters = computed(() =>
  [...uiStore.driveCharacters].sort((a, b) => {
    const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tB - tA;
  })
);

onMounted(ensureCharacters);


async function ensureCharacters() {
  if (
    uiStore.isSignedIn &&
    uiStore.driveCharacters.length === 0 &&
    props.dataManager.googleDriveManager
  ) {
    await uiStore.refreshDriveCharacters(props.dataManager.googleDriveManager);
  }
}

function refreshList() {
  uiStore.refreshDriveCharacters(props.dataManager.googleDriveManager);
}

async function saveNew() {
  if (props.saveToDrive) {
    await props.saveToDrive(null, characterStore.character.name);
  }
}

async function overwrite(ch) {
  if (props.saveToDrive) {
    await props.saveToDrive(ch.id, ch.name);
  }
}


function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}


async function confirmLoad(ch) {
  const result = await showModal(
    messages.characterHub.loadConfirm(ch.characterName || ch.name),
  );
  if (result.value === 'load') {
    await props.loadCharacter(ch.id, ch.name);
  }
}


async function deleteChar(ch) {
  const result = await showModal(
    messages.characterHub.deleteConfirm(ch.characterName || ch.name),
  );
  if (result.value === 'delete' && props.dataManager.googleDriveManager) {
    if (ch.id.startsWith('temp-')) {
      uiStore.cancelPendingDriveSave(ch.id);
      uiStore.removeDriveCharacter(ch.id);
      showToast({ type: 'success', ...messages.characterHub.delete.successToast() });
      return;
    }
    const previous = [...uiStore.driveCharacters];
    uiStore.removeDriveCharacter(ch.id);
    const deletePromise = props.dataManager.googleDriveManager
      .deleteCharacterFile(ch.id)
      .catch((err) => {
        uiStore.driveCharacters = previous;
        throw err;
      });
    showAsyncToast(deletePromise, {
      loading: messages.characterHub.delete.asyncToast.loading(),
      success: messages.characterHub.delete.asyncToast.success(),
      error: (err) => messages.characterHub.delete.asyncToast.error(err),
    });
    await deletePromise;
  }
}

async function exportLocal(ch) {
  const gdm = props.dataManager.googleDriveManager;
  if (!gdm) return;
  const exportPromise = gdm
    .loadCharacterFile(ch.id)
    .then(async (data) => {
      if (data) {
        await props.dataManager.saveData(
          data.character,
          data.skills,
          data.specialSkills,
          data.equipments,
          data.histories,
        );
      }
    });
  showAsyncToast(exportPromise, {
    loading: messages.characterHub.export.loading(),
    success: messages.characterHub.export.success(),
    error: (err) => messages.characterHub.export.error(err),
  });
}

</script>

<style scoped>
.character-hub {
  position: relative;
}



.character-hub--description {
  text-align: center;
}



.character-hub--list {
  list-style: none;
  padding: 0;
}
.character-hub--item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-content: space-around;
  gap: 3px;
  padding: 4px;
  margin-top: 4px;
}
.character-hub--name {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  padding-right: 50px;
  text-align: left;
  overflow-wrap: break-word;
  word-break: break-all;
}

.button-compact {
  padding: 3px 4px;
  font-size: 0.9em;
  border-radius: 0px;
  font-weight: 400;
  height: auto;
  width: auto;
}

.button-compact:hover {
  border-color: var(--color-accent-middle);
  color: var(--color-accent-light);
  background-color: transparent;
  box-shadow: none;
  text-shadow: none;
}

.button-compact:not(:first-of-type) {
  border-left: none;
}

.character-hub--date {
  color: var(--color-text-muted);
  flex-grow: 1;
}
.character-hub--actions-inline {
  display: flex;
}
.character-hub--item--highlighted {
  background-color: var(--color-panel-body);
  box-shadow:
    inset 0 0 2px var(--color-accent),
    0 0 6px var(--color-accent);
}

</style>
