import { AioniaGameData } from '../../data/gameData.js';

export function useClipboard(outputButtonText, outputButton) {
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position: fixed; top: 0; left: 0; opacity: 0;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        playOutputAnimation();
      } else {
        outputButtonText.value = AioniaGameData.uiMessages.outputButton.failed;
        setTimeout(() => {
          outputButtonText.value = AioniaGameData.uiMessages.outputButton.default;
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
  };

  const playOutputAnimation = () => {
    const button = outputButton.value;
    if (!button || button.classList.contains('is-animating')) return;

    const buttonMessages = AioniaGameData.uiMessages.outputButton;
    const timings = buttonMessages.animationTimings;

    button.classList.add('is-animating', 'state-1');

    setTimeout(() => {
      button.classList.remove('state-1');
      outputButtonText.value = buttonMessages.animating;
      button.classList.add('state-2');
    }, timings.state1_bgFill);

    setTimeout(() => {
      button.classList.remove('state-2');
      button.classList.add('state-3');
    }, timings.state1_bgFill + timings.state2_textHold);

    setTimeout(() => {
      button.classList.remove('state-3');
      outputButtonText.value = buttonMessages.default;
      button.classList.add('state-4');
    },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut);

    setTimeout(() => {
      button.classList.remove('is-animating', 'state-4');
    },
      timings.state1_bgFill +
        timings.state2_textHold +
        timings.state3_textFadeOut +
        timings.state4_bgReset);
  };

  const copyToClipboard = async (text) => {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      playOutputAnimation();
    } catch (err) {
      console.error('Failed to copy: ', err);
      fallbackCopyTextToClipboard(text);
    }
  };

  return { copyToClipboard };
}
