import { AioniaGameData } from '../../data/gameData.js';
import { CocofoliaExporter } from '../../services/cocofoliaExporter.js';

export function useCocofoliaOutput(copyToClipboard, currentWeight) {
  const exporter = new CocofoliaExporter();
  const outputToCocofolia = (character, skills, specialSkills, equipments) => {
    const exportData = {
      character,
      skills,
      specialSkills,
      equipments,
      currentWeight: currentWeight.value,
      speciesLabelMap: AioniaGameData.speciesLabelMap,
      equipmentGroupLabelMap: AioniaGameData.equipmentGroupLabelMap,
      specialSkillData: AioniaGameData.specialSkillData,
      specialSkillsRequiringNote: AioniaGameData.specialSkillsRequiringNote,
      weaponDamage: AioniaGameData.weaponDamage,
    };
    const cocofoliaCharacter = exporter.generateCocofoliaData(exportData);
    copyToClipboard(JSON.stringify(cocofoliaCharacter, null, 2));
  };
  return { outputToCocofolia };
}
