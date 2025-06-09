// src/listManager.js

// Using window.deepClone as it's globally available in the original main.js context.
// If this were a more standard module system, deepClone would be imported.
const deepClone = window.deepClone;

window.listManager = {
  _manageListItem({
    list,
    action,
    index,
    newItemFactory,
    hasContentChecker,
    maxLength,
  }) {
    if (action === "add") {
      if (maxLength && list.length >= maxLength) {
        return;
      }
      const newItem =
        typeof newItemFactory === "function"
          ? newItemFactory()
          : newItemFactory;
      list.push(
        typeof newItem === "object" && newItem !== null
          ? deepClone(newItem) // Ensure new items are cloned
          : newItem,
      );
    } else if (action === "remove") {
      if (list.length > 1) {
        list.splice(index, 1);
      } else if (
        list.length === 1 &&
        hasContentChecker &&
        hasContentChecker(list[index])
      ) {
        const emptyItem =
          typeof newItemFactory === "function"
            ? newItemFactory()
            : newItemFactory;
        list[index] =
          typeof emptyItem === "object" && emptyItem !== null
            ? deepClone(emptyItem) // Ensure reset item is cloned
            : emptyItem;
      }
    }
  },

  hasSpecialSkillContent(ss) {
    return !!(ss.group || ss.name || ss.note);
  },

  hasHistoryContent(h) {
    return !!(
      h.sessionName ||
      (h.gotExperiments !== null && h.gotExperiments !== "") ||
      h.memo
    );
  },

  addSpecialSkillItem(vueInstance) {
    this._manageListItem({
      list: vueInstance.specialSkills,
      action: "add",
      newItemFactory: () => ({
        group: "",
        name: "",
        note: "",
        showNote: false,
      }),
      maxLength: vueInstance.gameData.config.maxSpecialSkills,
    });
  },

  removeSpecialSkill(vueInstance, index) {
    this._manageListItem({
      list: vueInstance.specialSkills,
      action: "remove",
      index: index,
      newItemFactory: () => ({
        group: "",
        name: "",
        note: "",
        showNote: false,
      }),
      hasContentChecker: this.hasSpecialSkillContent,
    });
  },

  addExpert(skill) {
    // This method operates directly on the skill object passed to it.
    if (skill.canHaveExperts) {
      this._manageListItem({
        list: skill.experts,
        action: "add",
        newItemFactory: () => ({ value: "" }),
      });
    }
  },

  removeExpert(skill, expertIndex) {
    // This method operates directly on the skill object passed to it.
    this._manageListItem({
      list: skill.experts,
      action: "remove",
      index: expertIndex,
      newItemFactory: () => ({ value: "" }),
      hasContentChecker: (expert) =>
        expert.value && expert.value.trim() !== "",
    });
  },

  addHistoryItem(vueInstance) {
    this._manageListItem({
      list: vueInstance.histories,
      action: "add",
      newItemFactory: () => ({
        sessionName: "",
        gotExperiments: null,
        memo: "",
      }),
    });
  },

  removeHistoryItem(vueInstance, index) {
    this._manageListItem({
      list: vueInstance.histories,
      action: "remove",
      index: index,
      newItemFactory: () => ({
        sessionName: "",
        gotExperiments: null,
        memo: "",
      }),
      hasContentChecker: this.hasHistoryContent,
    });
  },
};
