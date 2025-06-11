import { ref } from "vue";
import { CocofoliaExporter } from "../../services/cocofoliaExporter.js";
import { AioniaGameData } from "../../data/gameData.js";

export function useOutput(outputButton) {
  const outputButtonText = ref(AioniaGameData.uiMessages.outputButton.default);
  const exporter = new CocofoliaExporter();

  const playOutputAnimation = () => {
    const button = outputButton.value;
    if (!button || button.classList.contains("is-animating")) return;
    const msgs = AioniaGameData.uiMessages.outputButton;
    const t = msgs.animationTimings;
    button.classList.add("is-animating", "state-1");
    setTimeout(() => {
      button.classList.remove("state-1");
      outputButtonText.value = msgs.animating;
      button.classList.add("state-2");
    }, t.state1_bgFill);
    setTimeout(() => {
      button.classList.remove("state-2");
      button.classList.add("state-3");
    }, t.state1_bgFill + t.state2_textHold);
    setTimeout(
      () => {
        button.classList.remove("state-3");
        outputButtonText.value = msgs.default;
        button.classList.add("state-4");
      },
      t.state1_bgFill + t.state2_textHold + t.state3_textFadeOut,
    );
    setTimeout(
      () => {
        button.classList.remove("is-animating", "state-4");
      },
      t.state1_bgFill +
        t.state2_textHold +
        t.state3_textFadeOut +
        t.state4_bgReset,
    );
  };

  const copyToClipboard = async (text) => {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      playOutputAnimation();
    } catch {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
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
    } catch {
      outputButtonText.value = AioniaGameData.uiMessages.outputButton.error;
      setTimeout(() => {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.default;
      }, 3000);
    }
    document.body.removeChild(textArea);
  };

  const outputToCocofolia = (
    character,
    skills,
    specialSkills,
    equipments,
    histories,
  ) => {
    const exportData = {
      character,
      skills,
      specialSkills,
      equipments,
      currentWeight: 0,
      speciesLabelMap: AioniaGameData.speciesLabelMap,
      equipmentGroupLabelMap: AioniaGameData.equipmentGroupLabelMap,
      specialSkillData: AioniaGameData.specialSkillData,
      specialSkillsRequiringNote: AioniaGameData.specialSkillsRequiringNote,
      weaponDamage: AioniaGameData.weaponDamage,
    };
    const cocoData = exporter.generateCocofoliaData(exportData);
    copyToClipboard(JSON.stringify(cocoData, null, 2));
  };

  return { outputButtonText, outputToCocofolia, copyToClipboard };
}
