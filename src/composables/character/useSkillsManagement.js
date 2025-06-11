import { computed } from "vue";
import { manageListItem } from "./useListManagement.js";
import { AioniaGameData } from "../../data/gameData.js";

export function useSkillsManagement(skills, specialSkills) {
  const addExpert = (skill) => {
    if (skill.canHaveExperts)
      manageListItem({
        list: skill.experts,
        action: "add",
        newItemFactory: () => ({ value: "" }),
      });
  };

  const removeExpert = (skill, index) => {
    manageListItem({
      list: skill.experts,
      action: "remove",
      index,
      newItemFactory: () => ({ value: "" }),
      hasContentChecker: (expert) => expert.value && expert.value.trim() !== "",
    });
  };

  const addSpecialSkillItem = () =>
    manageListItem({
      list: specialSkills,
      action: "add",
      newItemFactory: () => ({
        group: "",
        name: "",
        note: "",
        showNote: false,
      }),
      maxLength: AioniaGameData.config.maxSpecialSkills,
    });

  const removeSpecialSkill = (index) =>
    manageListItem({
      list: specialSkills,
      action: "remove",
      index,
      newItemFactory: () => ({
        group: "",
        name: "",
        note: "",
        showNote: false,
      }),
      hasContentChecker: (ss) => !!(ss.group || ss.name || ss.note),
    });

  const expertPlaceholder = (skill) =>
    skill.checked
      ? AioniaGameData.placeholderTexts.expertSkill
      : AioniaGameData.placeholderTexts.expertSkillDisabled;

  const availableSpecialSkillNames = (index) =>
    specialSkills[index]
      ? AioniaGameData.specialSkillData[specialSkills[index].group] || []
      : [];

  const updateSpecialSkillOptions = (index) => {
    if (specialSkills[index]) {
      specialSkills[index].name = "";
      updateSpecialSkillNoteVisibility(index);
    }
  };

  const updateSpecialSkillNoteVisibility = (index) => {
    if (specialSkills[index]) {
      const skillName = specialSkills[index].name;
      specialSkills[index].showNote =
        AioniaGameData.specialSkillsRequiringNote.includes(skillName);
    }
  };

  return {
    addExpert,
    removeExpert,
    addSpecialSkillItem,
    removeSpecialSkill,
    expertPlaceholder,
    availableSpecialSkillNames,
    updateSpecialSkillOptions,
    updateSpecialSkillNoteVisibility,
  };
}
