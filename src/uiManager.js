// src/uiManager.js

export class UIManager {
  constructor(vueAppContext) {
    this.app = vueAppContext;
  }

  // --- Help Panel Methods ---
  handleHelpIconMouseOver() {
    if (this.app.isDesktop) {
      if (this.app.helpState === "closed") {
        this.app.helpState = "hovered";
      }
    }
  }

  handleHelpIconMouseLeave() {
    if (this.app.isDesktop) {
      if (this.app.helpState === "hovered") {
        this.app.helpState = "closed";
      }
    }
  }

  handleHelpIconClick() {
    if (this.app.isDesktop) {
      this.app.helpState = this.app.helpState === "fixed" ? "closed" : "fixed";
    } else {
      this.app.helpState = this.app.helpState === "closed" ? "fixed" : "closed";
    }
  }

  closeHelpPanel() {
    this.app.helpState = "closed";
  }

  // Note: handleClickOutside is intended to be called with the Vue context.
  // e.g., document.addEventListener('click', (event) => uiManagerInstance.handleClickOutside(vueAppInstance, event));
  handleClickOutside(vueAppInstance, event) {
    if (vueAppInstance.helpState === "fixed") {
      const helpPanelElement = vueAppInstance.$refs.helpPanel;
      const helpIconElement = vueAppInstance.$refs.helpIcon;
      if (helpPanelElement && helpIconElement) {
        if (
          !helpPanelElement.contains(event.target) &&
          !helpIconElement.contains(event.target)
        ) {
          vueAppInstance.helpState = "closed";
        }
      } else if (
        helpPanelElement &&
        !helpPanelElement.contains(event.target)
      ) {
        vueAppInstance.helpState = "closed";
      } else if (
        !helpPanelElement &&
        helpIconElement &&
        !helpIconElement.contains(event.target)
      ) {
        vueAppInstance.helpState = "closed";
      }
    }
  }

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
  }

  // --- Clipboard & Animation Methods ---
  async copyToClipboard(text) {
    if (!navigator.clipboard) {
      this.fallbackCopyTextToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.playOutputAnimation();
    } catch (err) {
      console.error("Failed to copy: ", err);
      this.fallbackCopyTextToClipboard(text);
    }
  }

  fallbackCopyTextToClipboard(text) {
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
        this.playOutputAnimation();
      } else {
        this.app.outputButtonText = this.app.gameData.uiMessages.outputButton.failed;
        setTimeout(() => {
          this.app.outputButtonText =
            this.app.gameData.uiMessages.outputButton.default;
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      this.app.outputButtonText = this.app.gameData.uiMessages.outputButton.error;
      setTimeout(() => {
        this.app.outputButtonText =
          this.app.gameData.uiMessages.outputButton.default;
      }, 3000);
    }
    document.body.removeChild(textArea);
  }

  playOutputAnimation() {
    const button = this.app.$refs.outputButton;
    if (!button || button.classList.contains("is-animating")) {
      return;
    }
    const buttonMessages = this.app.gameData.uiMessages.outputButton;
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
      this.app.outputButtonText = newText;
      button.classList.add("state-2");
    }, timeForState2);
    setTimeout(() => {
      button.classList.remove("state-2");
      button.classList.add("state-3");
    }, timeForState3);
    setTimeout(() => {
      button.classList.remove("state-3");
      this.app.outputButtonText = originalText;
      button.classList.add("state-4");
    }, timeForState4);
    setTimeout(() => {
      button.classList.remove("is-animating", "state-4");
    }, timeForCleanup);
  }

  // --- Drive Menu UI Toggle Method ---
  // This method is responsible for toggling the drive menu's visibility
  // and managing the click-outside-to-close listener.
  toggleDriveMenu() {
    this.app.showDriveMenu = !this.app.showDriveMenu;

    if (this.app.currentDriveMenuHandler) {
      document.removeEventListener("click", this.app.currentDriveMenuHandler, true);
      this.app.currentDriveMenuHandler = null;
    }

    if (this.app.showDriveMenu) {
      this.app.$nextTick(() => {
        const menuElement = this.app.$refs.driveMenu;
        const toggleButton = this.app.$refs.driveMenuToggleButton;

        if (menuElement && toggleButton) {
          // Define the handler within the UIManager instance's context if possible,
          // or ensure `this.app` is accessible.
          // Arrow function here ensures `this` refers to UIManager instance if needed,
          // but we are directly using `this.app`.
          this.app.currentDriveMenuHandler = (event) => {
            if (
              !menuElement.contains(event.target) &&
              !toggleButton.contains(event.target)
            ) {
              // Directly set showDriveMenu to false and clean up.
              this.app.showDriveMenu = false;
              if (this.app.currentDriveMenuHandler) {
                 document.removeEventListener("click", this.app.currentDriveMenuHandler, true);
                 this.app.currentDriveMenuHandler = null;
              }
            }
          };
          document.addEventListener("click", this.app.currentDriveMenuHandler, true);
        }
      });
    }
  }
}
