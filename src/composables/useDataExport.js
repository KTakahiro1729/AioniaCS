import { ref } from "vue";
import { DataManager } from "../services/dataManager.js";
import { CocofoliaExporter } from "../services/cocofoliaExporter.js";
import { AioniaGameData } from "../data/gameData.js";
import { useCharacterStore } from "../stores/characterStore.js";
import {
  generateShareKey,
  exportKeyToString,
  arrayBufferToBase64,
} from "../utils/crypto.js";

export function useDataExport(footerRef) {
  const characterStore = useCharacterStore();
  const dataManager = new DataManager(AioniaGameData);
  const cocofoliaExporter = new CocofoliaExporter();

  const outputButtonText = ref(AioniaGameData.uiMessages.outputButton.default);

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
        characterStore.skills.splice(
          0,
          characterStore.skills.length,
          ...parsedData.skills,
        );
        characterStore.specialSkills.splice(
          0,
          characterStore.specialSkills.length,
          ...parsedData.specialSkills,
        );
        Object.assign(characterStore.equipments, parsedData.equipments);
        characterStore.histories.splice(
          0,
          characterStore.histories.length,
          ...parsedData.histories,
        );
      },
      (errorMessage) => alert(errorMessage),
    );
  }

  function playOutputAnimation() {
    const button = footerRef.value?.outputButton;
    if (!button || button.classList.contains("is-animating")) return;
    const buttonMessages = AioniaGameData.uiMessages.outputButton;
    const timings = buttonMessages.animationTimings;

    button.classList.add("is-animating", "state-1");

    setTimeout(() => {
      button.classList.remove("state-1");
      outputButtonText.value = buttonMessages.animating;
      button.classList.add("state-2");
    }, timings.state1_bgFill);

    setTimeout(() => {
      button.classList.remove("state-2");
      button.classList.add("state-3");
    }, timings.state1_bgFill + timings.state2_textHold);

    setTimeout(
      () => {
        button.classList.remove("state-3");
        outputButtonText.value = buttonMessages.default;
        button.classList.add("state-4");
      },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut,
    );

    setTimeout(
      () => {
        button.classList.remove("is-animating", "state-4");
      },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut +
        timings.state4_bgReset,
    );
  }

  async function copyToClipboard(text) {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      playOutputAnimation();
    } catch (err) {
      console.error("Failed to copy: ", err);
      fallbackCopyTextToClipboard(text);
    }
  }

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.cssText = "position: fixed; top: 0; left: 0; opacity: 0;";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        playOutputAnimation();
      } else {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.failed;
        setTimeout(() => {
          outputButtonText.value =
            AioniaGameData.uiMessages.outputButton.default;
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      outputButtonText.value = AioniaGameData.uiMessages.outputButton.error;
      setTimeout(() => {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.default;
      }, 3000);
    }
    document.body.removeChild(textArea);
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
    const cocofoliaCharacter =
      cocofoliaExporter.generateCocofoliaData(exportData);
    const textToCopy = JSON.stringify(cocofoliaCharacter, null, 2);
    copyToClipboard(textToCopy);
  }

  async function generateShareLink(expiresIn) {
    let key = await generateShareKey();
    const encrypted = await dataManager.createEncryptedShareableZip(
      characterStore.character,
      characterStore.skills,
      characterStore.specialSkills,
      characterStore.equipments,
      characterStore.histories,
      key,
    );
    const payload = JSON.stringify({
      ciphertext: arrayBufferToBase64(encrypted.ciphertext),
      iv: arrayBufferToBase64(encrypted.iv),
    });
    const fileId = await dataManager.googleDriveManager.uploadAndShareFile(
      payload,
      "shared_data.enc",
      "application/json",
    );
    const keyString = await exportKeyToString(key);
    const expires = expiresIn ? Date.now() + expiresIn : 0;
    const url = `${window.location.origin}/s?fileId=${fileId}&expires=${expires}#${keyString}`;
    key = null;
    return url;
  }

  return {
    dataManager,
    outputButtonText,
    saveData,
    handleFileUpload,
    outputToCocofolia,
    generateShareLink,
  };
}
