import { ref } from "vue";

export function useDataExport(
  characterData,
  dataManager,
  cocofoliaExporter,
  outputButton,
  showCustomAlert,
) {
  const outputButtonText = ref(
    characterData.gameData.uiMessages.outputButton.default,
  );

  function saveData() {
    dataManager.saveData(
      characterData.character.value,
      characterData.skills.value,
      characterData.specialSkills.value,
      characterData.equipments.value,
      characterData.histories.value,
    );
  }

  function handleFileUpload(event) {
    dataManager.handleFileUpload(
      event,
      (parsedData) => {
        characterData.character.value = parsedData.character;
        characterData.skills.value = parsedData.skills;
        characterData.specialSkills.value = parsedData.specialSkills;
        characterData.equipments.value = parsedData.equipments;
        characterData.histories.value = parsedData.histories;
      },
      (errorMessage) => {
        showCustomAlert(errorMessage);
      },
    );
  }

  function playOutputAnimation() {
    const buttonEl = outputButton.value;
    if (!buttonEl || buttonEl.classList.contains("is-animating")) return;

    const buttonMessages = characterData.gameData.uiMessages.outputButton;
    const timings = buttonMessages.animationTimings;
    const originalText = buttonMessages.default;
    const newText = buttonMessages.animating;

    buttonEl.classList.add("is-animating", "state-1");

    setTimeout(() => {
      buttonEl.classList.remove("state-1");
      outputButtonText.value = newText;
      buttonEl.classList.add("state-2");
    }, timings.state1_bgFill);

    setTimeout(() => {
      buttonEl.classList.remove("state-2");
      buttonEl.classList.add("state-3");
    }, timings.state1_bgFill + timings.state2_textHold);

    setTimeout(
      () => {
        buttonEl.classList.remove("state-3");
        outputButtonText.value = originalText;
        buttonEl.classList.add("state-4");
      },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut,
    );

    setTimeout(
      () => {
        buttonEl.classList.remove("is-animating", "state-4");
      },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut +
        timings.state4_bgReset,
    );
  }

  async function copyToClipboard(text) {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
    } else {
      await navigator.clipboard.writeText(text);
      playOutputAnimation();
    }
  }

  function outputToCocofolia() {
    const exportData = {
      character: characterData.character.value,
      skills: characterData.skills.value,
      specialSkills: characterData.specialSkills.value,
      equipments: characterData.equipments.value,
      currentWeight: characterData.currentWeight.value,
      ...characterData.gameData,
    };
    const cocofoliaCharacter =
      cocofoliaExporter.generateCocofoliaData(exportData);
    const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
    copyToClipboard(textToCopy);
  }

  return {
    outputButtonText,
    saveData,
    handleFileUpload,
    outputToCocofolia,
  };
}
