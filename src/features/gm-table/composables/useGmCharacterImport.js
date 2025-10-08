import { ref } from 'vue';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { useGmTableStore } from '@/features/gm-table/stores/gmTableStore.js';
import { importCharacterFile } from '@/features/gm-table/services/gmTableImporter.js';

export function useGmCharacterImport() {
  const isImporting = ref(false);
  const store = useGmTableStore();
  const { showToast } = useNotifications();

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    isImporting.value = true;
    const tasks = Array.from(files).map(async (file) => {
      try {
        const { parsedData } = await importCharacterFile(file);
        store.addCharacter({ parsedData, file });
      } catch (error) {
        console.error('Failed to import character file', error);
        showToast({ type: 'error', title: '読込失敗', message: error?.message || 'キャラクターの読込に失敗しました。' });
      }
    });
    await Promise.all(tasks);
    isImporting.value = false;
  }

  async function reloadCharacter(character) {
    if (!character?.id || !character?.sourceFile) {
      showToast({ type: 'warning', title: '再読込不可', message: '元ファイル情報がありません。' });
      return;
    }
    try {
      const { parsedData } = await importCharacterFile(character.sourceFile);
      store.updateCharacterData(character.id, parsedData);
    } catch (error) {
      console.error('Failed to reload character file', error);
      showToast({ type: 'error', title: '再読込失敗', message: error?.message || 'キャラクターの再読込に失敗しました。' });
    }
  }

  return {
    isImporting,
    handleFiles,
    reloadCharacter,
  };
}
