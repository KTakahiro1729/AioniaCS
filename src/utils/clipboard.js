(function (global) {
  function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  async function copyText(text) {
    if (!navigator.clipboard) {
      fallbackCopyText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  global.ClipboardUtils = {
    copyText,
    fallbackCopyText,
  };
})(typeof window !== "undefined" ? window : globalThis);
