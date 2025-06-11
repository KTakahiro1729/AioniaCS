import { useListManagement } from "./useListManagement.js";

export function useSkillsManagement(skills) {
  const { manageListItem } = useListManagement();
  const addExpert = (skill) => {
    if (skill.canHaveExperts) {
      manageListItem({
        list: skill.experts,
        action: "add",
        newItemFactory: () => ({ value: "" }),
      });
    }
  };
  const removeExpert = (skill, index) => {
    manageListItem({
      list: skill.experts,
      action: "remove",
      index,
      newItemFactory: () => ({ value: "" }),
      hasContentChecker: (e) => e.value && e.value.trim() !== "",
    });
  };
  return { addExpert, removeExpert };
}
