<template>
  <transition name="modal">
    <div class="modal-overlay" v-if="true">
      <div class="modal character-hub">
        <button class="modal-close" @click="$emit('close')">×</button>
        <h2 class="character-hub__title">クラウドキャラクター</h2>
        <div class="character-hub__setting">
          <label>
            <input
              type="checkbox"
              v-model="uiStore.defaultSaveToCloud"
              @change="updateSetting"
            />
            デフォルトの保存先をクラウドにする
          </label>
        </div>
        <ul class="character-hub__list">
          <li v-for="ch in characters" :key="ch.id" class="character-hub__item">
            <button class="character-hub__name" @click="confirmLoad(ch)">
              {{ ch.name }}
            </button>
            <span class="character-hub__date">{{ formatDate(ch.updatedAt) }}</span>
            <div class="character-hub__actions">
              <button class="button-base" @click="toggleMenu(ch)">⋮</button>
              <div class="floating-menu" v-if="ch.showMenu">
                <button class="menu-item button-base" @click="renameChar(ch)">名前変更</button>
                <button class="menu-item button-base" @click="deleteChar(ch)">削除</button>
                <button class="menu-item button-base" @click="exportLocal(ch)">ローカルにエクスポート</button>
                <button class="menu-item button-base" @click="exportFolder(ch)">別フォルダにエクスポート</button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUiStore } from '../../stores/uiStore.js';
import { useNotifications } from '../../composables/useNotifications.js';

const props = defineProps({
  dataManager: Object,
  loadCharacter: Function,
});

const emit = defineEmits(['close']);

const uiStore = useUiStore();
const { showModal, showToast } = useNotifications();
const characters = ref([]);

onMounted(async () => {
  const gdm = props.dataManager.googleDriveManager;
  if (gdm) {
    characters.value = await gdm.readIndexFile();
  }
});

function updateSetting() {
  uiStore.setDefaultSaveToCloud(uiStore.defaultSaveToCloud);
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString();
}

function toggleMenu(ch) {
  ch.showMenu = !ch.showMenu;
}

async function confirmLoad(ch) {
  const result = await showModal({
    title: '読込確認',
    message: `${ch.name} を読み込みますか？`,
    buttons: [
      { label: '読込', value: 'load', variant: 'primary' },
      { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
    ],
  });
  if (result.value === 'load') {
    await props.loadCharacter(ch.id, ch.name);
  }
}

async function renameChar(ch) {
  const inputComp = {
    template: '<input type="text" v-model="name" />',
    setup() {
      const name = ref(ch.name);
      return { name };
    },
  };
  const result = await showModal({
    title: '名前変更',
    component: inputComp,
    buttons: [
      { label: '保存', value: 'ok', variant: 'primary' },
      { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
    ],
  });
  if (result.value === 'ok' && result.component?.name) {
    const newName = result.component.name;
    if (newName && props.dataManager.googleDriveManager) {
      await props.dataManager.googleDriveManager.renameIndexEntry(ch.id, newName);
      ch.name = newName;
    }
  }
  ch.showMenu = false;
}

async function deleteChar(ch) {
  const result = await showModal({
    title: '削除確認',
    message: `${ch.name} を削除しますか？`,
    buttons: [
      { label: '削除', value: 'delete', variant: 'primary' },
      { label: 'キャンセル', value: 'cancel', variant: 'secondary' },
    ],
  });
  if (result.value === 'delete' && props.dataManager.googleDriveManager) {
    await props.dataManager.googleDriveManager.deleteCharacterFile(ch.id);
    characters.value = characters.value.filter((c) => c.id !== ch.id);
  }
  ch.showMenu = false;
}

async function exportLocal(ch) {
  const gdm = props.dataManager.googleDriveManager;
  if (!gdm) return;
  showToast({ type: 'info', title: 'エクスポート', message: 'エクスポート中...' });
  try {
    const data = await gdm.loadCharacterFile(ch.id);
    if (data) {
      await props.dataManager.saveData(
        data.character,
        data.skills,
        data.specialSkills,
        data.equipments,
        data.histories,
      );
      showToast({ type: 'success', title: 'エクスポート完了', message: '' });
    }
  } catch (error) {
    showToast({ type: 'error', title: 'エクスポート失敗', message: error.message || '' });
  }
  ch.showMenu = false;
}

async function exportFolder(ch) {
  const gdm = props.dataManager.googleDriveManager;
  if (!gdm) return;
  gdm.showFolderPicker(async (err, folder) => {
    if (err || !folder) {
      showToast({ type: 'error', title: 'エクスポート失敗', message: err?.message || 'キャンセルされました' });
      ch.showMenu = false;
      return;
    }
    showToast({ type: 'info', title: 'エクスポート', message: 'エクスポート中...' });
    try {
      const data = await gdm.loadCharacterFile(ch.id);
      if (data) {
        const fileName = `${(ch.name || 'Aionia').replace(/[\\/:*?"<>|]/g, '_')}.json`;
        await gdm.saveFile(folder.id, fileName, JSON.stringify(data, null, 2));
        showToast({ type: 'success', title: 'エクスポート完了', message: '' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'エクスポート失敗', message: error.message || '' });
    }
    ch.showMenu = false;
  });
}
</script>

<style scoped>
.character-hub {
  position: relative;
}
.character-hub__title {
  margin-bottom: 1rem;
  font-size: 1.4em;
  color: var(--color-text-normal);
}
.character-hub__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.character-hub__item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.character-hub__name {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
}
.character-hub__date {
  color: var(--color-text-muted);
  flex-grow: 1;
}
.character-hub__actions {
  position: relative;
}
.character-hub__setting {
  margin-bottom: 1rem;
}
.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
}
.modal-close:hover {
  color: var(--color-text-normal);
}
</style>
