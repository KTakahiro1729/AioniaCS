import { AioniaGameData } from "../../data/gameData.js";

export function useSkillsManagement() {
  const expertPlaceholder = (skill) =>
    skill.checked
      ? AioniaGameData.placeholderTexts.expertSkill
      : AioniaGameData.placeholderTexts.expertSkillDisabled;

  return {
    expertPlaceholder,
  };
}
