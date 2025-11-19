import { DataManager } from '@/features/character-sheet/services/dataManager.js';
import { CocofoliaExporter } from '@/features/character-sheet/services/cocofoliaExporter.js';
import { AioniaGameData } from '@/data/gameData.js';
import { useCharacterStore } from '@/features/character-sheet/stores/characterStore.js';
import { useNotifications } from '@/features/notifications/composables/useNotifications.js';
import { messages } from '@/locales/ja.js';
import { copyText } from '@/shared/utils/clipboard.js';
import { useUiStore } from '@/features/cloud-sync/stores/uiStore.js';
import { buildSnapshotFromStore } from '@/features/character-sheet/utils/characterSnapshot.js';

export function useDataExport() {
  const characterStore = useCharacterStore();
  const dataManager = new DataManager(AioniaGameData);
  const cocofoliaExporter = new CocofoliaExporter();
  const { showToast } = useNotifications();
  const uiStore = useUiStore();

  async function saveData() {
    const snapshot = buildSnapshotFromStore(characterStore);
    await dataManager.saveData(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
    );
    uiStore.setLastSavedSnapshot(snapshot);
  }

  function handleFileUpload(event) {
    dataManager.handleFileUpload(
      event,
      (parsedData) => {
        Object.assign(characterStore.character, parsedData.character);
        characterStore.skills.splice(0, characterStore.skills.length, ...parsedData.skills);
        characterStore.specialSkills.splice(0, characterStore.specialSkills.length, ...parsedData.specialSkills);
        Object.assign(characterStore.equipments, parsedData.equipments);
        characterStore.histories.splice(0, characterStore.histories.length, ...parsedData.histories);
        uiStore.setLastSavedSnapshot(buildSnapshotFromStore(characterStore));
      },
      (errorMessage) =>
        showToast({
          type: 'error',
          ...messages.dataExport.loadError(errorMessage),
        }),
    );
  }

  async function copyToClipboard(text) {
    try {
      await copyText(text);
      document.dispatchEvent(
        new CustomEvent('aionia-copy-success', {
          detail: { type: 'cocofolia' },
        }),
      );
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast({ type: 'error', title: messages.outputButton.error });
    }
  }

  function outputToCocofolia() {
    const exportData = {
      character: characterStore.character,
      skills: characterStore.skills,
      specialSkills: characterStore.specialSkills,
      equipments: characterStore.equipments,
      currentWeight: characterStore.currentWeight,
      speciesLabelMap: AioniaGameData.speciesLabelMap,
      equipmentGroupLabelMap: AioniaGameData.equipmentGroupLabelMap,
      specialSkillData: AioniaGameData.specialSkillData,
      specialSkillsRequiringNote: AioniaGameData.specialSkillsRequiringNote,
      weaponDamage: AioniaGameData.weaponDamage,
    };
    const cocofoliaCharacter = cocofoliaExporter.generateCocofoliaData(exportData);
    const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
    copyToClipboard(textToCopy);
  }

  return {
    dataManager,
    saveData,
    handleFileUpload,
    outputToCocofolia,
  };
}
