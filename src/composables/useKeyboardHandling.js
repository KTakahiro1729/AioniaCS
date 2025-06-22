import { onMounted, onBeforeUnmount } from "vue";

export function useKeyboardHandling() {
  if (!window.visualViewport) {
    return;
  }

  const body = document.body;
  const root = document.documentElement;
  let keyboardVisible = false;
  const heightThreshold = 100;

  function handleViewportResize() {
    const keyboardHeight = window.innerHeight - window.visualViewport.height;
    if (keyboardHeight > heightThreshold) {
      body.classList.add("keyboard-visible");
      root.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
      keyboardVisible = true;
    } else if (keyboardVisible) {
      body.classList.remove("keyboard-visible");
      root.style.removeProperty("--keyboard-height");
      keyboardVisible = false;
    }
  }

  function onFocus(event) {
    if (event.target.matches("input, textarea")) {
      setTimeout(handleViewportResize, 200);
    }
  }

  function onFocusOut(event) {
    if (event.target.matches("input, textarea")) {
      setTimeout(() => {
        body.classList.remove("keyboard-visible");
        root.style.removeProperty("--keyboard-height");
        keyboardVisible = false;
      }, 200);
    }
  }

  onMounted(() => {
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport.addEventListener("resize", handleViewportResize);
    if (
      document.activeElement &&
      (document.activeElement.matches("input") ||
        document.activeElement.matches("textarea"))
    ) {
      setTimeout(handleViewportResize, 200);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener("focusin", onFocus);
    document.removeEventListener("focusout", onFocusOut);
    window.visualViewport.removeEventListener("resize", handleViewportResize);
    body.classList.remove("keyboard-visible");
    root.style.removeProperty("--keyboard-height");
    keyboardVisible = false;
  });
}
