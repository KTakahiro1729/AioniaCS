// src/listManager.js

/**
 * Generic function to manage adding or removing items from a list.
 * @param {object} options - The options for managing the list.
 * @param {Array} options.list - The list to manage.
 * @param {string} options.action - 'add' or 'remove'.
 * @param {number} [options.index] - The index for 'remove' action.
 * @param {Function|object} options.newItemFactory - Factory function or object for new items.
 * @param {Function} [options.hasContentChecker] - Function to check if an item has content (for removal logic).
 * @param {number} [options.maxLength] - Maximum length for the list (for 'add' action).
 */
function _manageListItem({
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
        ? window.deepClone(newItem) // Assuming deepClone is globally available
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
          ? window.deepClone(emptyItem) // Assuming deepClone is globally available
          : emptyItem;
    }
  }
}

// --- Content Checkers ---
function hasSpecialSkillContent(ss) {
  return !!(ss.group || ss.name || ss.note);
}

function hasHistoryContent(h) {
  return !!(
    h.sessionName ||
    (h.gotExperiments !== null && h.gotExperiments !== "") ||
    h.memo
  );
}

// --- Specific List Management Functions ---

export function addSpecialSkillItem(specialSkillsList, gameDataConfig) {
  _manageListItem({
    list: specialSkillsList,
    action: "add",
    newItemFactory: () => ({
      group: "",
      name: "",
      note: "",
      showNote: false,
    }),
    maxLength: gameDataConfig.maxSpecialSkills,
  });
}

export function removeSpecialSkill(specialSkillsList, index) {
  _manageListItem({
    list: specialSkillsList,
    action: "remove",
    index: index,
    newItemFactory: () => ({
      group: "",
      name: "",
      note: "",
      showNote: false,
    }),
    hasContentChecker: hasSpecialSkillContent,
  });
}

export function addExpert(skill) {
  // Expects skill.experts to be the list
  if (skill.canHaveExperts) {
    _manageListItem({
      list: skill.experts,
      action: "add",
      newItemFactory: () => ({ value: "" }),
    });
  }
}

export function removeExpert(skill, expertIndex) {
  // Expects skill.experts to be the list
  _manageListItem({
    list: skill.experts,
    action: "remove",
    index: expertIndex,
    newItemFactory: () => ({ value: "" }),
    hasContentChecker: (expert) =>
      expert.value && expert.value.trim() !== "",
  });
}

export function addHistoryItem(historiesList) {
  _manageListItem({
    list: historiesList,
    action: "add",
    newItemFactory: () => ({
      sessionName: "",
      gotExperiments: null,
      memo: "",
    }),
  });
}

export function removeHistoryItem(historiesList, index) {
  _manageListItem({
    list: historiesList,
    action: "remove",
    index: index,
    newItemFactory: () => ({
      sessionName: "",
      gotExperiments: null,
      memo: "",
    }),
    hasContentChecker: hasHistoryContent,
  });
}

// Exporting the core function too, in case it's needed for other lists directly,
// though it's typically better to create specific wrappers like above.
export { _manageListItem };
