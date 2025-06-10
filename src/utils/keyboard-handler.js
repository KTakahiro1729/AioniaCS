const body = document.body;
const initialHeight = window.innerHeight;
let keyboardVisible = false;

// Threshold for height change to detect keyboard (adjust as needed)
const heightThreshold = 150; // pixels

function onFocus(event) {
  if (event.target.matches("input, textarea")) {
    // Give a slight delay for the keyboard to actually appear
    // and the resize event to fire.
    setTimeout(checkKeyboard, 200);
  }
}

function onBlur(event) {
  if (event.target.matches("input, textarea")) {
    // Give a slight delay for the keyboard to hide and resize event to fire.
    setTimeout(checkKeyboard, 200);
  }
}

function checkKeyboard() {
  const currentHeight = window.innerHeight;
  if (initialHeight - currentHeight > heightThreshold) {
    if (!keyboardVisible) {
      body.classList.add("keyboard-visible");
      keyboardVisible = true;
      // console.log('Keyboard likely visible');
    }
  } else {
    if (keyboardVisible) {
      body.classList.remove("keyboard-visible");
      keyboardVisible = false;
      // console.log('Keyboard likely hidden');
    }
  }
}

// More robust check on resize events
function handleResize() {
  // We only care about resize events that might indicate keyboard changes.
  // Focusing an input often triggers a resize.
  // This is a fallback and primary detection for some scenarios.
  checkKeyboard();
}

// Listen to focus and blur events on the document
document.addEventListener("focusin", onFocus);
document.addEventListener("focusout", onBlur);
window.addEventListener("resize", handleResize);

// Initial check in case an input is already focused on page load
// This might happen if the page reloads with an input focused
if (
  document.activeElement &&
  (document.activeElement.matches("input") ||
    document.activeElement.matches("textarea"))
) {
  setTimeout(checkKeyboard, 200);
}
