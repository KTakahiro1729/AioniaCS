// src/uiManager.js

window.uiManager = {
  // --- Help Panel Methods ---
  handleHelpIconMouseOver(vueInstance) {
    if (vueInstance.isDesktop) {
      if (vueInstance.helpState === "closed") {
        vueInstance.helpState = "hovered";
      }
    }
  },
  handleHelpIconMouseLeave(vueInstance) {
    if (vueInstance.isDesktop) {
      if (vueInstance.helpState === "hovered") {
        vueInstance.helpState = "closed";
      }
    }
  },
  handleHelpIconClick(vueInstance) {
    if (vueInstance.isDesktop) {
      vueInstance.helpState = vueInstance.helpState === "fixed" ? "closed" : "fixed";
    } else {
      vueInstance.helpState = vueInstance.helpState === "closed" ? "fixed" : "closed";
    }
  },
  closeHelpPanel(vueInstance) {
    vueInstance.helpState = "closed";
  },
  handleClickOutside(vueInstance, event) {
    if (vueInstance.helpState === "fixed") {
      const helpPanelElement = vueInstance.$refs.helpPanel;
      const helpIconElement = vueInstance.$refs.helpIcon;
      if (helpPanelElement && helpIconElement) {
        if (
          !helpPanelElement.contains(event.target) &&
          !helpIconElement.contains(event.target)
        ) {
          vueInstance.helpState = "closed";
        }
      } else if (
        helpPanelElement &&
        !helpPanelElement.contains(event.target)
      ) {
        vueInstance.helpState = "closed";
      } else if (
        !helpPanelElement &&
        helpIconElement &&
        !helpIconElement.contains(event.target)
      ) {
        vueInstance.helpState = "closed";
      }
    }
  },

  // --- Custom Alert Method ---
  showCustomAlert(message) {
    const alertModalId = "custom-alert-modal";
    let modal = document.getElementById(alertModalId);

    if (modal) {
      modal.remove();
    }

    let lastFocusedElement = document.activeElement;

    modal = document.createElement("div");
    modal.id = alertModalId;
    modal.classList.add("custom-alert-modal");
    modal.setAttribute("role", "alertdialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("tabindex", "-1");

    const titleElement = document.createElement("h4");
    titleElement.id = "custom-alert-title";
    titleElement.textContent = "アラート"; // "Alert"
    modal.appendChild(titleElement);
    modal.setAttribute("aria-labelledby", titleElement.id);

    const messageP = document.createElement("p");
    messageP.id = "custom-alert-message-content";
    messageP.classList.add("custom-alert-message");
    messageP.textContent = message;
    modal.appendChild(messageP);
    modal.setAttribute("aria-describedby", messageP.id);

    const closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    closeButton.classList.add("custom-alert-button");

    const closeCustomAlertModal = () => {
      modal.removeEventListener("keydown", handleModalKeyDown);
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
      if (
        lastFocusedElement &&
        typeof lastFocusedElement.focus === "function"
      ) {
        lastFocusedElement.focus();
      }
    };

    const handleModalKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCustomAlertModal();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButton.focus();
      }
    };

    closeButton.onclick = closeCustomAlertModal;
    modal.appendChild(closeButton);
    document.body.appendChild(modal);
    modal.addEventListener("keydown", handleModalKeyDown);
    requestAnimationFrame(() => {
      closeButton.focus();
    });
  },

  // --- Clipboard Interaction Methods ---
  async copyToClipboard(vueInstance, text) {
    if (!navigator.clipboard) {
      this.fallbackCopyTextToClipboard(vueInstance, text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.playOutputAnimation(vueInstance);
    } catch (err) {
      console.error("Failed to copy: ", err);
      this.fallbackCopyTextToClipboard(vueInstance, text);
    }
  },
  fallbackCopyTextToClipboard(vueInstance, text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        this.playOutputAnimation(vueInstance);
      } else {
        vueInstance.outputButtonText = vueInstance.gameData.uiMessages.outputButton.failed;
        setTimeout(() => {
          vueInstance.outputButtonText =
            vueInstance.gameData.uiMessages.outputButton.default;
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      vueInstance.outputButtonText = vueInstance.gameData.uiMessages.outputButton.error;
      setTimeout(() => {
        vueInstance.outputButtonText = vueInstance.gameData.uiMessages.outputButton.default;
      }, 3000);
    }
    document.body.removeChild(textArea);
  },
  playOutputAnimation(vueInstance) {
    const button = vueInstance.$refs.outputButton;
    if (!button || button.classList.contains("is-animating")) {
      return;
    }
    const buttonMessages = vueInstance.gameData.uiMessages.outputButton;
    const timings = buttonMessages.animationTimings;
    const originalText = buttonMessages.default;
    const newText = buttonMessages.animating;
    button.classList.add("is-animating");
    const timeForState2 = timings.state1_bgFill;
    const timeForState3 = timeForState2 + timings.state2_textHold;
    const timeForState4 = timeForState3 + timings.state3_textFadeOut;
    const timeForCleanup = timeForState4 + timings.state4_bgReset;

    button.classList.add("state-1");
    setTimeout(() => {
      button.classList.remove("state-1");
      vueInstance.outputButtonText = newText;
      button.classList.add("state-2");
    }, timeForState2);
    setTimeout(() => {
      button.classList.remove("state-2");
      button.classList.add("state-3");
    }, timeForState3);
    setTimeout(() => {
      button.classList.remove("state-3");
      vueInstance.outputButtonText = originalText;
      button.classList.add("state-4");
    }, timeForState4);
    setTimeout(() => {
      button.classList.remove("is-animating", "state-4");
    }, timeForCleanup);
  },

  // --- Menu and Dropdown Toggle Methods ---
  toggleDriveMenu(vueInstance) {
    vueInstance.showDriveMenu = !vueInstance.showDriveMenu;
  }
};
