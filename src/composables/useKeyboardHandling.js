import { onMounted, onBeforeUnmount } from 'vue';

export function useKeyboardHandling() {
  const body = document.body;
  let initialHeight = window.innerHeight;
  let keyboardVisible = false;
  const heightThreshold = 150;

  function checkKeyboard() {
    const currentHeight = window.innerHeight;
    if (initialHeight - currentHeight > heightThreshold) {
      if (!keyboardVisible) {
        body.classList.add('keyboard-visible');
        keyboardVisible = true;
      }
    } else if (keyboardVisible) {
      body.classList.remove('keyboard-visible');
      keyboardVisible = false;
    }
  }

  function onFocus(event) {
    if (event.target.matches('input, textarea')) {
      setTimeout(checkKeyboard, 200);
    }
  }

  function onBlur(event) {
    if (event.target.matches('input, textarea')) {
      setTimeout(checkKeyboard, 200);
    }
  }

  function handleResize() {
    checkKeyboard();
  }

  onMounted(() => {
    initialHeight = window.innerHeight;
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    window.addEventListener('resize', handleResize);
    if (document.activeElement && (document.activeElement.matches('input') || document.activeElement.matches('textarea'))) {
      setTimeout(checkKeyboard, 200);
    }
  });

  onBeforeUnmount(() => {
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('focusout', onBlur);
    window.removeEventListener('resize', handleResize);
    body.classList.remove('keyboard-visible');
    keyboardVisible = false;
  });
}
