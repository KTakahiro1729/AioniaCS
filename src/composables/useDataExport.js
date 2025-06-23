import { DataManager } from '../services/dataManager.js';
import { CocofoliaExporter } from '../services/cocofoliaExporter.js';
import { AioniaGameData } from '../data/gameData.js';
import { useCharacterStore } from '../stores/characterStore.js';
import { useNotifications } from './useNotifications.js';
import { messages } from '../locales/ja.js';
import { copyText } from '../utils/clipboard.js';

export function useDataExport() {
  const characterStore = useCharacterStore();
  const dataManager = new DataManager(AioniaGameData);
  const cocofoliaExporter = new CocofoliaExporter();
  const { showToast } = useNotifications();

  function saveData() {
    dataManager.saveData(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
    );
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
