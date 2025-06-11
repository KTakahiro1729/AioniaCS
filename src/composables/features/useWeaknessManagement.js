import { computed, isRef } from "vue";
import { AioniaGameData } from "../../data/gameData.js";

export function useWeaknessManagement(histories) {
  const historiesArray = computed(() =>
    isRef(histories) ? histories.value : histories,
  );

  const sessionNamesForWeaknessDropdown = computed(() => {
    const defaultOptions = [...AioniaGameData.weaknessAcquisitionOptions];
    const sessionOptions = historiesArray.value
      .map((h) => h.sessionName)
      .filter((name) => name && name.trim() !== "")
      .map((name) => ({ value: name, text: name, disabled: false }));
    const helpOption = {
      value: "help-text",
      text: AioniaGameData.uiMessages.weaknessDropdownHelp,
      disabled: true,
    };
    return defaultOptions.concat(sessionOptions, helpOption);
  });

  return { sessionNamesForWeaknessDropdown };
}
