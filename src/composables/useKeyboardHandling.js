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

  onMounted(() => {
    window.visualViewport.addEventListener("resize", handleViewportResize);
    handleViewportResize();
  });

  onBeforeUnmount(() => {
    window.visualViewport.removeEventListener("resize", handleViewportResize);
    body.classList.remove("keyboard-visible");
    root.style.removeProperty("--keyboard-height");
    keyboardVisible = false;
  });
}
